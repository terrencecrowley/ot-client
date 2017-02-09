/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var express = __webpack_require__(1);
	var bodyParser = __webpack_require__(2);
	var cookieParser = __webpack_require__(3);
	var app = express();
	var OTManager = __webpack_require__(4);
	var serverContext = new OTManager.ServerContext();
	var sessionManager = new OTManager.SessionManager(serverContext);
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(cookieParser());
	// Setup PORT
	var port = process.env.PORT || 3000;
	// Routes
	var router = express.Router();
	var joinRouter = express.Router();
	// Middleware
	router.use(function (req, res, next) {
	    serverContext.log(1, "Request");
	    next();
	});
	joinRouter.use(function (req, res, next) {
	    serverContext.log(1, "Join Request");
	    next();
	});
	// HTML routes
	app.use('/', express.static('public'));
	app.use('/scripts', express.static('clientdist'));
	// API routes
	router.route('/sessions')
	    .get(function (req, res) {
	    serverContext.log(1, "listSessions");
	    sessionManager.listSessions(req, res);
	});
	router.route('/sessions/create')
	    .post(function (req, res) {
	    serverContext.log(1, "createSession");
	    sessionManager.createSession(req, res);
	});
	router.route('/sessions/connect/:session_id')
	    .post(function (req, res) {
	    serverContext.log(1, "connectSession");
	    sessionManager.connectSession(req, res, req.params.session_id);
	});
	router.route('/sessions/sendevent/:session_id')
	    .post(function (req, res) {
	    serverContext.log(1, "sendEvent");
	    serverContext.log(1, JSON.stringify(req.body));
	    sessionManager.sendEvent(req, res, req.params.session_id, req.body);
	});
	router.route('/sessions/receiveevent/:session_id')
	    .post(function (req, res) {
	    serverContext.log(1, "receiveEvent");
	    serverContext.log(1, JSON.stringify(req.body));
	    sessionManager.receiveEvent(req, res, req.params.session_id, req.body);
	});
	;
	// Api routes
	app.use('/api', router);
	// Join existing session
	joinRouter.route('/:session_id')
	    .get(function (req, res) {
	    var options = { root: 'public' };
	    res.sendFile('index.html', options);
	});
	app.use('/join', joinRouter);
	app.listen(port);
	serverContext.log(0, "Listening on port " + port);


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("body-parser");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("cookie-parser");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var OT = __webpack_require__(5);
	var fs = __webpack_require__(6);
	var StateVersion = 2.0;
	var ClientIDForServer = '-';
	function createGuid() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
	        return v.toString(16);
	    });
	}
	var clientQuiescentTimeout = process.env.CLIENT_QUIESCENT_TIMEOUT || 20000; // 20 seconds
	var sessionQuiescentTimeout = process.env.SESSION_QUIESCENT_TIMEOUT || 6000000; // 100 minutes
	var clientMaxCount = process.env.CLIENT_MAX_COUNT || 50;
	var maxEditLogSize = process.env.MAX_EDIT_LOG_SIZE || 500;
	var ServerContext = (function () {
	    function ServerContext() {
	        this.verbosity = process.env.VERBOSITY || 0;
	    }
	    ServerContext.prototype.flagIsSet = function (flag) {
	        return false;
	    };
	    ServerContext.prototype.flagValue = function (flag) {
	        return 0;
	    };
	    ServerContext.prototype.log = function (verbose, s) {
	        if (verbose <= this.verbosity)
	            console.log(s);
	    };
	    return ServerContext;
	}());
	exports.ServerContext = ServerContext;
	var Client = (function () {
	    // constructor
	    function Client(ctx, cid) {
	        this.clientID = cid;
	        this.context = ctx;
	        this.lastActive = new Date();
	        this.longPollResponse = null;
	        this.longPollResponseBody = null;
	    }
	    Client.prototype.isZombie = function (fromDate, timeout) {
	        if (fromDate === undefined)
	            fromDate = new Date();
	        if (timeout === undefined)
	            timeout = clientQuiescentTimeout;
	        return ((fromDate.getTime() - this.lastActive.getTime()) > timeout);
	    };
	    Client.prototype.markAlive = function () {
	        this.lastActive = new Date();
	        return this;
	    };
	    Client.prototype.parkResponse = function (res, body) {
	        this.longPollResponse = res;
	        this.longPollResponseBody = body;
	    };
	    Client.prototype.unparkResponse = function () {
	        if (this.longPollResponse) {
	            this.context.log(2, "unparkResponse for client: " + String(this.clientID));
	            this.longPollResponse.json(this.longPollResponseBody);
	            this.longPollResponse = null;
	            this.longPollResponseBody = null;
	        }
	    };
	    return Client;
	}());
	exports.Client = Client;
	var Session = (function () {
	    // Constructor
	    function Session(ctx) {
	        this.context = ctx;
	        this.sessionID = createGuid();
	        this.serverEngine = new OT.OTServerEngine(ctx, this.sessionID);
	        this.clients = [];
	        this.lastActive = new Date();
	        this.clientSequenceNo = 0;
	        this.statMaxClients = 0;
	        this.statRequestCount = 0;
	        this.context.log(0, "session(" + this.sessionID + "): created.");
	    }
	    Session.prototype.isZombie = function (fromDate, timeout) {
	        if (fromDate === undefined)
	            fromDate = new Date();
	        if (timeout === undefined)
	            timeout = sessionQuiescentTimeout;
	        return (this.clients.length == 0) && ((fromDate.getTime() - this.lastActive.getTime()) > timeout);
	    };
	    Session.prototype.unparkClients = function () {
	        for (var i = 0; i < this.clients.length; i++)
	            this.clients[i].unparkResponse();
	    };
	    Session.prototype.getUserList = function () {
	        var val = this.serverEngine.stateServer.toValue();
	        val = val ? val['WellKnownName_users'] : val;
	        if (val == null)
	            val = {};
	        return val;
	    };
	    Session.prototype.getUserName = function (client) {
	        var val = this.getUserList();
	        return val[client.clientID];
	    };
	    Session.prototype.updateUserList = function () {
	        var now = new Date();
	        var val = this.getUserList();
	        var cedit = new OT.OTCompositeResource(this.sessionID, ClientIDForServer);
	        var medit = new OT.OTMapResource('WellKnownName_users');
	        cedit.edits.push(medit);
	        cedit.clock = this.serverEngine.serverClock();
	        for (var i = this.clients.length - 1; i >= 0; i--) {
	            var c = this.clients[i];
	            if (c.isZombie(now)) {
	                if (val[c.clientID] !== undefined)
	                    medit.edits.push([OT.OpMapDel, c.clientID, '']);
	                this.context.log(0, "session(" + this.sessionID + "): removing zombie client(" + c.clientID + ")");
	                this.clients.splice(i, 1);
	            }
	        }
	        if (!medit.isEmpty()) {
	            cedit.clientSequenceNo = this.clientSequenceNo++;
	            this.serverEngine.addServer(cedit);
	        }
	    };
	    Session.prototype.compress = function () {
	        // Would probably make more sense to make how we compress dynamic based on how clients are behaving.
	        // Also, a better approach would be to just keep composed variants along size the main array and
	        // then more slowly age out the finer grained log entries. But just do this for now so the log
	        // doesn't grow without bound.
	        if (this.serverEngine.logServer.length > maxEditLogSize) {
	            // Just compress first 20%
	            var nCompress = Math.floor(maxEditLogSize / 5);
	            var cedit = this.serverEngine.logServer[0];
	            for (var i = 1; i < nCompress; i++)
	                cedit.compose(this.serverEngine.logServer[i]);
	            this.serverEngine.logServer.splice(1, nCompress - 1);
	            this.context.log(0, "session(" + this.sessionID + "): compressing log.");
	        }
	    };
	    // Connect
	    Session.prototype.connectSession = function (req, res) {
	        this.lastActive = new Date();
	        this.statRequestCount++;
	        var responseBody;
	        if (this.clients.length >= clientMaxCount) {
	            responseBody = { "result": 2, "message": 'Too many clients.' };
	        }
	        else {
	            var clientID = createGuid();
	            var userName = req.cookies.userName;
	            var client = new Client(this.context, clientID);
	            this.clients.push(client);
	            if (this.clients.length > this.statMaxClients)
	                this.statMaxClients = this.clients.length;
	            this.context.log(0, "session(" + this.sessionID + "): creating client(" + client.clientID + ")");
	            responseBody = { "result": 0, "clientID": client.clientID };
	            if (userName) {
	                res.cookie('userName', userName);
	                responseBody.userName = userName;
	            }
	        }
	        this.context.log(1, "connectSession: " + JSON.stringify(responseBody));
	        res.json(responseBody);
	        this.updateUserList();
	    };
	    Session.prototype.nakedEditList = function (nextclock) {
	        var a;
	        if (nextclock === 0)
	            a = this.serverEngine.logServer;
	        else {
	            var nLog = this.serverEngine.logServer.length;
	            var i = void 0;
	            if (nLog == 0)
	                return [];
	            for (i = nLog - 1; i >= 0; i--)
	                if (this.serverEngine.logServer[i].clock == nextclock)
	                    break;
	                else if (this.serverEngine.logServer[i].clock < nextclock) {
	                    // FIX: really should fail this request if I requested a nextclock that was compressed out.
	                    // Really the only valid case this clause is catching is the end of the array case.
	                    i++;
	                    break;
	                }
	            if (i === -1)
	                return [];
	            a = this.serverEngine.logServer.slice(i);
	        }
	        var retA = [];
	        for (var i = 0; i < a.length; i++)
	            retA.push(a[i].toJSON());
	        return retA;
	    };
	    // Client Event
	    // IN: { clientID: id, Edit: OT.OTCompositeResource }
	    // OUT: { "result": 0, "EditList":[ OT.OTCompositeResource ] }
	    Session.prototype.sendEvent = function (req, res, body) {
	        this.lastActive = new Date();
	        this.statRequestCount++;
	        this.unparkClients();
	        var edit = OT.OTCompositeResource.constructFromObject(body["Edit"]);
	        var client = this.findClient(body["clientID"]).markAlive();
	        var responseBody = null;
	        var nResult = this.serverEngine.addServer(edit);
	        if (nResult === OT.clockSuccess) {
	            // Drain any unsent actions (including this one)
	            responseBody = { "result": 0, "EditList": this.nakedEditList(edit.clock + 1) };
	            // Cookiefy user name
	            var name_1 = this.getUserName(client);
	            if (name_1 != '')
	                res.cookie('userName', name_1);
	        }
	        else {
	            // Clock unavailable
	            responseBody = { "result": nResult, "message": "sendEvent: failure: " + nResult };
	        }
	        this.context.log(1, "sendEvent: " + JSON.stringify(responseBody));
	        res.json(responseBody);
	    };
	    // Receive Event
	    // IN: { clientID: id, NextClock: number }
	    // OUT: { "result": 0, "EditList": [ OT.OTCompositeResource ] }
	    Session.prototype.receiveEvent = function (req, res, body) {
	        this.lastActive = new Date();
	        this.statRequestCount++;
	        var client = this.findClient(body["clientID"]).markAlive();
	        var nextClock = Number(body["NextClock"]);
	        var responseBody = null;
	        if (nextClock === NaN) {
	            responseBody = { "result": 1, "message": "receiveEvent: invalid clock: " + body["NextClock"] };
	        }
	        else {
	            // Send any unsent edits
	            responseBody = { "result": 0, "EditList": this.nakedEditList(nextClock) };
	            if (responseBody.EditList.length == 0) {
	                client.parkResponse(res, responseBody);
	                return;
	            }
	        }
	        this.context.log(1, "receiveEvent: " + JSON.stringify(responseBody));
	        res.json(responseBody);
	    };
	    Session.prototype.logStats = function () {
	        this.context.log(0, "session(" + this.sessionID + "): terminating.");
	        this.context.log(0, "session(" + this.sessionID + "): MaxClients(" + String(this.statMaxClients) + ")");
	        this.context.log(0, "session(" + this.sessionID + "): Requests(" + String(this.statRequestCount) + ")");
	    };
	    // Helpers
	    Session.prototype.findClient = function (cid) {
	        for (var i = 0; i < this.clients.length; i++) {
	            var c_1 = this.clients[i];
	            if (c_1.clientID === cid)
	                return c_1;
	        }
	        // Presume we edited it out after quiescence - reconstruct on the fly
	        this.context.log(0, "session(" + this.sessionID + "): reconstructing zombie client(" + cid + ")");
	        var c = new Client(this.context, cid);
	        this.clients.push(c);
	        return c;
	    };
	    Session.prototype.toJSON = function () {
	        return this.serverEngine.toJSON();
	    };
	    Session.prototype.fromJSON = function (o) {
	        this.serverEngine.loadFromObject(o);
	    };
	    return Session;
	}());
	exports.Session = Session;
	var SessionManager = (function () {
	    // constructor
	    function SessionManager(ctx) {
	        this.context = ctx;
	        this.sessions = [];
	        this.bTimerSet = false;
	        this.bSaving = false;
	        this.nHouseKeeping = 0;
	        this.setHousekeepingTimer();
	        this.load();
	    }
	    // List Session
	    // OUT: { "result": 0, "sessions": [ { "session_id": string}* ] }
	    SessionManager.prototype.listSessions = function (req, res) {
	        var responseBody = { "result": 0 };
	        var aSession = [];
	        for (var i = 0; i < this.sessions.length; i++)
	            aSession.push({ "session_id": this.sessions[i].sessionID });
	        responseBody["sessions"] = aSession;
	        this.context.log(1, "listSessions: " + JSON.stringify(responseBody));
	        res.json(responseBody);
	        this.setHousekeepingTimer();
	    };
	    // Create
	    // OUT: { "result": 0, "session_id": string }
	    SessionManager.prototype.createSession = function (req, res) {
	        var session = new Session(this.context);
	        this.sessions.push(session);
	        var responseBody = { "result": 0, "session_id": session.sessionID };
	        this.context.log(1, "createSession: " + JSON.stringify(responseBody));
	        res.json(responseBody);
	        this.bDirty = true;
	        this.setHousekeepingTimer();
	    };
	    // Connect
	    // OUT: { "result": [0,1], "message": "failure message", "clientID": cid }
	    SessionManager.prototype.connectSession = function (req, res, session_id) {
	        var session = this.findSession(session_id);
	        if (session) {
	            session.connectSession(req, res);
	            this.bDirty = true;
	        }
	        else {
	            var responseBody = { "result": 1, "message": "connectSession: no such session: " + session_id };
	            this.context.log(1, "connectSession: " + JSON.stringify(responseBody));
	            res.json(responseBody);
	        }
	        this.setHousekeepingTimer();
	    };
	    // Send Event
	    // IN: { clientID: id, Edit: OT.OTCompositeResource }
	    // OUT: { "result": 0, "EditList":[ OT.OTCompositeResource ] }
	    SessionManager.prototype.sendEvent = function (req, res, session_id, body) {
	        var session = this.findSession(session_id);
	        if (session) {
	            session.sendEvent(req, res, body);
	            this.bDirty = true;
	        }
	        else {
	            var responseBody = { "result": 1, "message": "sendEvent: no such session: " + session_id };
	            this.context.log(1, "sendEvent: " + JSON.stringify(responseBody));
	            res.json(responseBody);
	        }
	        this.setHousekeepingTimer();
	    };
	    // Receive Event
	    // IN: { clientID: id, NextClock: number }
	    // OUT: { "result": 0 "EditList": [ OT.OTCompositeResource ] }
	    SessionManager.prototype.receiveEvent = function (req, res, session_id, body) {
	        var session = this.findSession(session_id);
	        if (session)
	            session.receiveEvent(req, res, body);
	        else {
	            var responseBody = { "result": 1, "message": "receiveEvent: no such session: " + session_id };
	            this.context.log(1, "receiveEvent: " + JSON.stringify(responseBody));
	            res.json(responseBody);
	        }
	        this.setHousekeepingTimer();
	    };
	    // Helpers
	    SessionManager.prototype.findSession = function (session_id) {
	        for (var i = 0; i < this.sessions.length; i++)
	            if (this.sessions[i].sessionID === session_id)
	                return this.sessions[i];
	        return null;
	    };
	    // housekeeping Timer
	    SessionManager.prototype.housekeepingOnTimer = function () {
	        this.nHouseKeeping++;
	        var now = new Date();
	        this.bTimerSet = false;
	        // Get rid of quiescent clients
	        for (var i = this.sessions.length - 1; i >= 0; i--) {
	            var session = this.sessions[i];
	            // Unpark any parked long-poll clients
	            session.unparkClients();
	            // Update user list
	            session.updateUserList();
	            // Compress session log
	            session.compress();
	            // Delete if necessary
	            if (session.isZombie(now)) {
	                session.logStats();
	                this.sessions.splice(i, 1);
	            }
	        }
	        // Preserve state for restart every once in a while
	        if ((this.nHouseKeeping % 2) == 0)
	            this.save();
	        // Do it again
	        this.setHousekeepingTimer();
	    };
	    // Set timer for housekeeping
	    SessionManager.prototype.setHousekeepingTimer = function () {
	        theManager = this;
	        if (!this.bTimerSet && this.sessions.length > 0) {
	            if (this.sessions.length > 0) {
	                this.bTimerSet = true;
	                setTimeout(function () { theManager.housekeepingOnTimer(); }, 5000);
	            }
	            else
	                this.save();
	        }
	    };
	    SessionManager.prototype.toJSON = function () {
	        var o = { version: StateVersion, sessions: {} };
	        var oSessions = o.sessions;
	        for (var i = 0; i < this.sessions.length; i++) {
	            var session = this.sessions[i];
	            oSessions[session.sessionID] = session.toJSON();
	        }
	        return o;
	    };
	    SessionManager.prototype.fromJSON = function (o) {
	        // Ignore unknown versions
	        var version = o['version'];
	        if (version === undefined || version != StateVersion)
	            return;
	        // Load sessions
	        o = o['sessions'];
	        if (o === undefined)
	            return;
	        for (var p in o)
	            if (o.hasOwnProperty(p)) {
	                var session = new Session(this.context);
	                session.sessionID = p;
	                session.fromJSON(o[p]);
	                this.sessions.push(session);
	            }
	    };
	    SessionManager.prototype.save = function () {
	        try {
	            if (this.bDirty && !this.bSaving) {
	                var s = JSON.stringify(this);
	                this.bSaving = true;
	                fs.writeFile('state/state.json', s, function (err) {
	                    theManager.bSaving = false;
	                    theManager.bDirty = false;
	                    if (err)
	                        throw err;
	                });
	                this.context.log(0, "SessionManager: state saved");
	            }
	        }
	        catch (err) {
	            this.context.log(0, "SessionManager: save state failed: " + err);
	        }
	    };
	    SessionManager.prototype.load = function () {
	        try {
	            var s = fs.readFileSync('state/state.json', 'utf8');
	            var o = JSON.parse(s);
	            this.fromJSON(o);
	            this.bDirty = false;
	        }
	        catch (err) {
	            this.context.log(0, "SessionManager: load state failed: " + err);
	        }
	    };
	    return SessionManager;
	}());
	exports.SessionManager = SessionManager;
	var theManager;


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("@terrencecrowley/ot-js");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("fs");

/***/ }
/******/ ]);
//# sourceMappingURL=guiserver.bundle.js.map