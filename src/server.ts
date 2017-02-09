import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";

var app = express();

import * as OTManager from './session';

let serverContext: OTManager.ServerContext = new OTManager.ServerContext();
var sessionManager: OTManager.SessionManager = new OTManager.SessionManager(serverContext);
 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Setup PORT
var port = process.env.PORT || 3000;

// Routes
var router = express.Router();
var joinRouter = express.Router();

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
  
// API routes
router.route('/sessions')

	// Respond with list of sessions
	.get(function(req, res) {
		serverContext.log(1, "listSessions");
		sessionManager.listSessions(req, res);
		});

router.route('/sessions/create')
	.post(function(req, res) {
		serverContext.log(1, "createSession");
		sessionManager.createSession(req, res);
		});

router.route('/sessions/connect/:session_id')
	.post(function(req, res) {
		serverContext.log(1, "connectSession");
		sessionManager.connectSession(req, res, req.params.session_id);
		});

router.route('/sessions/sendevent/:session_id')
	.post(function(req, res) {
		serverContext.log(1, "sendEvent");
		serverContext.log(1, JSON.stringify(req.body));
		sessionManager.sendEvent(req, res, req.params.session_id, req.body);
		});

router.route('/sessions/receiveevent/:session_id')
   	.post(function(req, res) {
		serverContext.log(1, "receiveEvent");
		serverContext.log(1, JSON.stringify(req.body));
		sessionManager.receiveEvent(req, res, req.params.session_id, req.body);
		});;
   
// Api routes
app.use('/api', router);

// Join existing session
joinRouter.route('/:session_id')
	.get(function(req, res) {
		let options = { root:  'public' };
		res.sendFile('index.html', options);
		});
app.use('/join', joinRouter);

app.listen(port);
serverContext.log(0, "Listening on port " + port);
