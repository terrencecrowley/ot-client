import * as OT from '@terrencecrowley/ot-js';
import * as fs from 'fs';

const StateVersion: number = 2.0;
const ClientIDForServer: string = '-';

function createGuid(): string
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

const clientQuiescentTimeout: number = process.env.CLIENT_QUIESCENT_TIMEOUT || 20000; // 20 seconds
const sessionQuiescentTimeout: number = process.env.SESSION_QUIESCENT_TIMEOUT || 6000000; // 100 minutes
const clientMaxCount: number = process.env.CLIENT_MAX_COUNT || 50;
const maxEditLogSize: number = process.env.MAX_EDIT_LOG_SIZE || 500;

export class ServerContext implements OT.IExecutionContext
{
	verbosity: number;

	constructor()
		{
			this.verbosity = process.env.VERBOSITY || 0;
		}

	flagIsSet(flag: string): boolean
		{
			return false;
		}

	flagValue(flag: string): number
		{
			return 0;
		}

	log(verbose: number, s: string): void
		{
			if (verbose <= this.verbosity)
				console.log(s);	
		}
}

export class Client
{
	clientID: string;
	private context: ServerContext;
	private lastActive: Date;
	private longPollResponse: any;
	private longPollResponseBody: any;

	// constructor
	constructor(ctx: ServerContext, cid: string)
		{
			this.clientID = cid;
			this.context = ctx;
			this.lastActive = new Date();
			this.longPollResponse = null;
			this.longPollResponseBody = null;
		}

	
	isZombie(fromDate?: Date, timeout?: number): boolean
		{
			if (fromDate === undefined) fromDate = new Date();
			if (timeout === undefined) timeout = clientQuiescentTimeout;

			return ((fromDate.getTime() - this.lastActive.getTime()) > timeout);
		}

	markAlive(): Client
		{
			this.lastActive = new Date();
			return this;
		}

	parkResponse(res: any, body: any): void
		{
			this.longPollResponse = res;
			this.longPollResponseBody = body;
		}

	unparkResponse(): void
		{
			if (this.longPollResponse)
			{
				this.context.log(2, "unparkResponse for client: " + String(this.clientID));
				this.longPollResponse.json(this.longPollResponseBody);
				this.longPollResponse = null;
				this.longPollResponseBody = null;
			}
		}
}

export class Session
{
	sessionID: string;
	serverEngine: OT.OTServerEngine;
	clients: Client[];
	private context: ServerContext;
	private lastActive: Date;
	private clientSequenceNo: number;
	// stats
	private statMaxClients: number;
	private statRequestCount: number;

	// Constructor
	constructor(ctx: ServerContext)
		{
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

	isZombie(fromDate?: Date, timeout?: number): boolean
		{
			if (fromDate === undefined) fromDate = new Date();
			if (timeout === undefined) timeout = sessionQuiescentTimeout;
			return (this.clients.length == 0) && ((fromDate.getTime() - this.lastActive.getTime()) > timeout);
		}

	unparkClients(): void
		{
			for (let i: number = 0; i < this.clients.length; i++)
				this.clients[i].unparkResponse();
		}

	getUserList(): any
		{
			let val: any = this.serverEngine.stateServer.toValue();
			val = val ? val['WellKnownName_users'] : val;
			if (val == null) val = { };
			return val;
		}

	getUserName(client: Client): any
		{
			let val: any = this.getUserList();
			return val[client.clientID];
		}

	updateUserList(): void
		{
			let now: Date = new Date();
			let val: any = this.getUserList();
			let cedit: OT.OTCompositeResource = new OT.OTCompositeResource(this.sessionID, ClientIDForServer);
			let medit: OT.OTMapResource = new OT.OTMapResource('WellKnownName_users');
			cedit.edits.push(medit);
			cedit.clock = this.serverEngine.serverClock();
			for (let i: number = this.clients.length-1; i >= 0; i--) // backwards since may be deleting
			{
				let c: Client = this.clients[i];
				if (c.isZombie(now))
				{
					if (val[c.clientID] !== undefined)
						medit.edits.push([ OT.OpMapDel, c.clientID, '' ]);
					this.context.log(0, "session(" + this.sessionID + "): removing zombie client(" + c.clientID + ")");
					this.clients.splice(i, 1);
				}
			}
			if (! medit.isEmpty())
			{
				cedit.clientSequenceNo = this.clientSequenceNo++;
				this.serverEngine.addServer(cedit);
			}
		}

	compress(): void
		{
			// Would probably make more sense to make how we compress dynamic based on how clients are behaving.
			// Also, a better approach would be to just keep composed variants along size the main array and
			// then more slowly age out the finer grained log entries. But just do this for now so the log
			// doesn't grow without bound.
			if (this.serverEngine.logServer.length > maxEditLogSize)
			{
				// Just compress first 20%
				let nCompress: number = Math.floor(maxEditLogSize / 5);
				let cedit: OT.OTCompositeResource = this.serverEngine.logServer[0];
				for (let i: number = 1; i < nCompress; i++)
					cedit.compose(this.serverEngine.logServer[i]);
				this.serverEngine.logServer.splice(1, nCompress-1);
				this.context.log(0, "session(" + this.sessionID + "): compressing log.");
			}
		}

	// Connect
	connectSession(req: any, res: any): void
		{
			this.lastActive = new Date();
			this.statRequestCount++;
			let responseBody: any;
			if (this.clients.length >= clientMaxCount)
			{
				responseBody = { "result": 2, "message": 'Too many clients.' };
			}
			else
			{
				let clientID: any = createGuid();
				let userName: any = req.cookies.userName;
				let client: Client = new Client(this.context, clientID);
				this.clients.push(client);
				if (this.clients.length > this.statMaxClients) this.statMaxClients = this.clients.length;
				this.context.log(0, "session(" + this.sessionID + "): creating client(" + client.clientID + ")");
				responseBody = { "result": 0, "clientID": client.clientID };
				if (userName)
				{
					res.cookie('userName', userName);
					responseBody.userName = userName;
				}
			}
			this.context.log(1, "connectSession: " + JSON.stringify(responseBody));
			res.json(responseBody);
			this.updateUserList();
		}

	private nakedEditList(nextclock: number): any
		{
			let a: OT.OTCompositeResource[];
			if (nextclock === 0)
				a = this.serverEngine.logServer;
			else
			{
				let nLog: number = this.serverEngine.logServer.length;
				let i: number;
				if (nLog == 0)
					return [];
				for (i = nLog-1; i >= 0; i--)
					if (this.serverEngine.logServer[i].clock == nextclock)
						break;
					else if (this.serverEngine.logServer[i].clock < nextclock)
					{
						// FIX: really should fail this request if I requested a nextclock that was compressed out.
						// Really the only valid case this clause is catching is the end of the array case.
						i++;
						break;
					}
				if (i === -1)
					return [];
				a = this.serverEngine.logServer.slice(i);
			}
			let retA: any[] = [];
			for (let i: number = 0; i < a.length; i++)
				retA.push(a[i].toJSON());
			return retA;
		}

	// Client Event
		// IN: { clientID: id, Edit: OT.OTCompositeResource }
		// OUT: { "result": 0, "EditList":[ OT.OTCompositeResource ] }
	sendEvent(req: any, res: any, body: any): void
		{
			this.lastActive = new Date();
			this.statRequestCount++;
			this.unparkClients();
			let edit: OT.OTCompositeResource = OT.OTCompositeResource.constructFromObject(body["Edit"]);
			let client: Client = this.findClient(body["clientID"]).markAlive();
			let responseBody: any = null;
			let nResult: number = this.serverEngine.addServer(edit);
			if (nResult === OT.clockSuccess)
			{
				// Drain any unsent actions (including this one)
				responseBody = { "result": 0, "EditList": this.nakedEditList(edit.clock + 1) };
				// Cookiefy user name
				let name: any = this.getUserName(client);
				if (name != '')
					res.cookie('userName', name);
			}
			else
			{
				// Clock unavailable
				responseBody = { "result": nResult, "message": "sendEvent: failure: " + nResult };
			}
			this.context.log(1, "sendEvent: " + JSON.stringify(responseBody));
			res.json(responseBody);
		}

	// Receive Event
		// IN: { clientID: id, NextClock: number }
		// OUT: { "result": 0, "EditList": [ OT.OTCompositeResource ] }
	receiveEvent(req: any, res: any, body: any): void
		{
			this.lastActive = new Date();
			this.statRequestCount++;
			let client: Client = this.findClient(body["clientID"]).markAlive();
			let nextClock: number = Number(body["NextClock"]);
			let responseBody: any = null;
			if (nextClock === NaN)
			{
				responseBody = { "result": 1, "message": "receiveEvent: invalid clock: " + body["NextClock"] };
			}
			else
			{
				// Send any unsent edits
				responseBody = { "result": 0, "EditList": this.nakedEditList(nextClock) };
				if (responseBody.EditList.length == 0)
				{
					client.parkResponse(res, responseBody);
					return;
				}
			}
			this.context.log(1, "receiveEvent: " + JSON.stringify(responseBody));
			res.json(responseBody);
		}

	logStats(): void
		{
			this.context.log(0, "session(" + this.sessionID + "): terminating.");
			this.context.log(0, "session(" + this.sessionID + "): MaxClients(" + String(this.statMaxClients) + ")");
			this.context.log(0, "session(" + this.sessionID + "): Requests(" + String(this.statRequestCount) + ")");
		}

	// Helpers
	findClient(cid: string): Client
		{
			for (let i: number = 0; i < this.clients.length; i++)
			{
				let c: Client = this.clients[i];

				if (c.clientID === cid)
					return c;
			}

			// Presume we edited it out after quiescence - reconstruct on the fly
			this.context.log(0, "session(" + this.sessionID + "): reconstructing zombie client(" + cid + ")");
			let c: Client = new Client(this.context, cid);
			this.clients.push(c);
			return c;
		}

	toJSON(): any
		{
			return this.serverEngine.toJSON();
		}

	fromJSON(o: any): void
		{
			this.serverEngine.loadFromObject(o);
		}
}

export class SessionManager
{
	private context: ServerContext;
	private sessions: Session[];
	private bTimerSet: boolean;
	private bDirty: boolean;
	private bSaving: boolean;
	private nHouseKeeping: number;

	// constructor
	constructor(ctx: ServerContext)
		{
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
	listSessions(req: any, res: any): void
		{
			let responseBody: any = { "result": 0 };
			let aSession: Array<any> = [];
			for (let i = 0; i < this.sessions.length; i++)
				aSession.push({ "session_id": this.sessions[i].sessionID });
			responseBody["sessions"] = aSession;
			this.context.log(1, "listSessions: " + JSON.stringify(responseBody));
			res.json(responseBody);
			this.setHousekeepingTimer();
		}

	// Create
		// OUT: { "result": 0, "session_id": string }
	createSession(req: any, res: any): void
		{
			let session: Session = new Session(this.context);
			this.sessions.push(session);
			let responseBody: any = { "result": 0, "session_id": session.sessionID };
			this.context.log(1, "createSession: " + JSON.stringify(responseBody));
			res.json(responseBody);
			this.bDirty = true;
			this.setHousekeepingTimer();
		}

	// Connect
		// OUT: { "result": [0,1], "message": "failure message", "clientID": cid }
	connectSession(req: any, res: any, session_id: string): void
		{
			let session: Session = this.findSession(session_id);
			if (session)
			{
				session.connectSession(req, res);
				this.bDirty = true;
			}
			else
			{
				let responseBody: any = { "result": 1, "message": "connectSession: no such session: " + session_id };
				this.context.log(1, "connectSession: " + JSON.stringify(responseBody));
				res.json(responseBody);
			}
			this.setHousekeepingTimer();
		}

	// Send Event
		// IN: { clientID: id, Edit: OT.OTCompositeResource }
		// OUT: { "result": 0, "EditList":[ OT.OTCompositeResource ] }
	sendEvent(req: any, res: any, session_id: string, body: any): void
		{
			let session: Session = this.findSession(session_id);
			if (session)
			{
				session.sendEvent(req, res, body);
				this.bDirty = true;
			}
			else
			{
				let responseBody: any = { "result": 1, "message": "sendEvent: no such session: " + session_id };
				this.context.log(1, "sendEvent: " + JSON.stringify(responseBody));
				res.json(responseBody);
			}
			this.setHousekeepingTimer();
		}

	// Receive Event
		// IN: { clientID: id, NextClock: number }
		// OUT: { "result": 0 "EditList": [ OT.OTCompositeResource ] }
	receiveEvent(req: any, res: any, session_id: string, body: any): void
		{
			let session: Session = this.findSession(session_id);
			if (session)
				session.receiveEvent(req, res, body);
			else
			{
				let responseBody: any = { "result": 1, "message": "receiveEvent: no such session: " + session_id };
				this.context.log(1, "receiveEvent: " + JSON.stringify(responseBody));
				res.json(responseBody);
			}
			this.setHousekeepingTimer();
		}

	// Helpers
	findSession(session_id: string): Session
		{
			for (let i: number = 0; i < this.sessions.length; i++)
				if (this.sessions[i].sessionID === session_id)
					return this.sessions[i];
			return null;
		}

	// housekeeping Timer
	housekeepingOnTimer(): void
		{
			this.nHouseKeeping++;

			let now: Date = new Date();
			this.bTimerSet = false;

			// Get rid of quiescent clients
			for (let i: number = this.sessions.length-1; i >= 0; i--) // backwards so deleting simplified
			{
				let session: Session = this.sessions[i];

				// Unpark any parked long-poll clients
				session.unparkClients();

				// Update user list
				session.updateUserList();

				// Compress session log
				session.compress();

				// Delete if necessary
				if (session.isZombie(now))
				{
					session.logStats();
					this.sessions.splice(i, 1);
				}
			}

			// Preserve state for restart every once in a while
			if ((this.nHouseKeeping % 2) == 0)
				this.save();

			// Do it again
			this.setHousekeepingTimer();
		}

	// Set timer for housekeeping
	setHousekeepingTimer(): void
		{
			theManager = this;

			if (!this.bTimerSet && this.sessions.length > 0)
			{
				if (this.sessions.length > 0)
				{
					this.bTimerSet = true;
					setTimeout(function () { theManager.housekeepingOnTimer(); }, 5000);
				}
				else
					this.save();
			}
		}

	toJSON(): any
		{
			let o: any = { version: StateVersion, sessions: { } };
			let oSessions: any = o.sessions;

			for (let i: number = 0; i < this.sessions.length; i++)
			{
				let session: Session = this.sessions[i];

				oSessions[session.sessionID] = session.toJSON();
			}
			return o;
		}

	fromJSON(o: any): void
		{
			// Ignore unknown versions
			let version: number = o['version'];
			if (version === undefined || version != StateVersion)
				return;

			// Load sessions
			o = o['sessions'];
			if (o === undefined)
				return;

			for (var p in o)
				if (o.hasOwnProperty(p))
				{
					let session: Session = new Session(this.context);
					session.sessionID = p;
					session.fromJSON(o[p]);
					this.sessions.push(session);
				}
		}

	save(): void
		{
			try
			{
				if (this.bDirty && !this.bSaving)
				{
					let s: string = JSON.stringify(this);
					this.bSaving = true;
					fs.writeFile('state/state.json', s, (err) => {
							theManager.bSaving = false;
							theManager.bDirty = false;
							if (err) throw err;
						});
					this.context.log(0, "SessionManager: state saved");
				}
			}
			catch (err)
			{
				this.context.log(0, "SessionManager: save state failed: " + err);
			}
		}

	load(): void
		{
			try
			{
				let s: string = fs.readFileSync('state/state.json', 'utf8');
				let o: any = JSON.parse(s);
				this.fromJSON(o);
				this.bDirty = false;
			}
			catch (err)
			{
				this.context.log(0, "SessionManager: load state failed: " + err);
			}
		}
}

let theManager: SessionManager;