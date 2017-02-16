import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import * as passport from "passport";
import * as passport_facebook from "passport-facebook";
import flash = require("connect-flash");
import * as UM from "./users";

let app = express();

import * as OTManager from './session';

let serverContext: OTManager.ServerContext = new OTManager.ServerContext();
var sessionManager: OTManager.SessionManager = new OTManager.SessionManager(serverContext);
 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(flash());
app.use(session({secret: 'OT server', saveUninitialized: true, resave: true, cookie: { maxAge: 1000 * 60 * 60 * 48 } }));
app.use(passport.initialize());
app.use(passport.session());

// Setup PORT
let port = process.env.PORT || 3000;

// Setup Authentication
let clientID = process.env.FACEBOOK_APP_ID || "";
let clientSecret = process.env.FACEBOOK_APP_SECRET || "";
let clientCallbackURL = process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/auth/facebook/callback";

// Routes
let router = express.Router();
let joinRouter = express.Router();

// Middleware
router.use(function(req, res, next) {
	serverContext.log(1, "Request");
	next();
});
joinRouter.use(function(req, res, next) {
	serverContext.log(1, "Join Request");
	next();
});

// HTML routes
app.use('/', express.static('public'));
app.use('/scripts', express.static('clientdist'));

// Authentication and user management
let FacebookStrategy = passport_facebook.Strategy;
passport.serializeUser(function(user: UM.User, done: any) {
	done(null, user.id);
	});
passport.deserializeUser(function(id: any, done: any) {
	let user: UM.User = sessionManager.users.findByID(id);
	done(null, user);
	});
passport.use(new FacebookStrategy(
		{
			clientID: clientID,
			clientSecret: clientSecret,
			callbackURL: clientCallbackURL,
			profileFields: ['emails', 'displayName', 'name']
		},

		function(token, refreshToken, profile, done) {

			process.nextTick(function() {
				let user: UM.User = sessionManager.users.findByID(profile.id);
				if (user)
					return done(null, user);
				else
				{
					console.log("Facebook profile:");
					console.log(profile);
					let o: any = { id: profile.id, token: token };
					if (profile.name)
						o.name = profile.name.givenName + ' ' + profile.name.familyName;
					else
						o.name = 'anon';
					if (profile.emails)
						o.email = profile.emails[0].value;
					else
						o.email = "someone@anywhere.com";
					console.log("Creating user:");
					console.log(o);
					user = sessionManager.users.createUser(o);
					done(null, user);
				}
			});
		})
	);

// Middleware to protect API calls with authentication status
function isLoggedIn(req: any, res: any, next: any) {
	if (req.user)
		return next();
	res.redirect('/auth/facebook');
}

function isLoggedInAPI(req: any, res: any, next: any) {
	if (req.user)
		return next();
	res.sendStatus(401);
}
  
// Authenticated pages
app.use('/pages', isLoggedIn, express.static('pages'));

// Authentication routes
app.get('/', function(req: any, res: any) {
	if (req.user)
		res.render('/pages/index.html');
	else
		res.redirect('/auth/facebook');
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: '/pages/index.html',
		failureRedirect: '/'
		}));

app.get('/logout', function(req: any, res: any) {
	console.log("Trace: logout");
	req.logout();
	res.redirect('/');
	});

// API routes
router.route('/sessions')

	// Respond with list of sessions
	.get(isLoggedInAPI, function(req, res) {
		serverContext.log(1, "listSessions");
		sessionManager.listSessions(req, res);
		});

router.route('/sessions/create')
	.post(isLoggedInAPI, function(req, res) {
		serverContext.log(1, "createSession");
		sessionManager.createSession(req, res);
		});

router.route('/sessions/connect/:session_id')
	.post(isLoggedInAPI, function(req, res) {
		serverContext.log(1, "connectSession");
		sessionManager.connectSession(req, res, req.params.session_id);
		});

router.route('/sessions/sendevent/:session_id')
	.post(isLoggedInAPI, function(req, res) {
		serverContext.log(1, "sendEvent");
		serverContext.log(1, JSON.stringify(req.body));
		sessionManager.sendEvent(req, res, req.params.session_id, req.body);
		});

router.route('/sessions/receiveevent/:session_id')
   	.post(isLoggedInAPI, function(req, res) {
		serverContext.log(1, "receiveEvent");
		serverContext.log(1, JSON.stringify(req.body));
		sessionManager.receiveEvent(req, res, req.params.session_id, req.body);
		});;
   
// Api routes
app.use('/api', router);

// Join existing session
joinRouter.route('/:session_id')
	.get(isLoggedInAPI, function(req, res) {
		let options: any = { root: '/' };
		res.sendFile('pages/index.html');
		});
app.use('/join', joinRouter);

app.listen(port);
serverContext.log(0, "Listening on port " + port);
