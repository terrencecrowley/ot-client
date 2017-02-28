import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";

export let MetaResource: string = "WellKnownName_meta";

export class SpeedManager
{
	private _Speed: number;
	private _SlowCounter: number;

	get speed(): number { return this._Speed; }

	constructor()
		{
			this._Speed = 100;
			this._SlowCounter = 0;
		}

	speedUp(): void
		{
			this._Speed = 100;	// Speed up quickly.
			this._SlowCounter = 0;
		}

	slowDown(): void
		{
			this._SlowCounter++; // Slow down slowly
			if (this._SlowCounter == 10 && this._Speed < 5000)
			{
				this._SlowCounter = 0;
				this._Speed *= 2;
			}
		}
}

const ReqCreate: number = 0;
const ReqJoin: number = 1;
const ReqSendEdit: number = 2;
const ReqReceiveEdit: number = 3;
const ReqUser: number = 4;
const ReqEdit: number = 5;	// Pseudo request that launches either SendEdit or ReceiveEdit depending on context
const NRequestTypes: number = 5;

export class ClientSessionState
{
	sessionID: string;
	sessionView: any;
	pendingType: string;
	clientEngine: OT.OTClientEngine;
	meta: any;
	bFull: boolean;
	bReachable: boolean;
	baPending: boolean[];
	parent: ClientSession;

	constructor(cs: ClientSession)
		{
			this.parent = cs;
			this.sessionID = '';
			this.sessionView = {};
			this.pendingType = '';
			this.clientEngine = null;
			this.meta = {};
			this.bReachable = false;
			this.bFull = false;
			this.baPending = [];
			for (let i: number = 0; i < NRequestTypes; i++) this.baPending[i] = false;
		}

	getProp(p: string): string
		{
			return this.meta[p];
		}

	getType(): string
		{
			return this.getProp('type');
		}

	getName(): string
		{
			return this.getProp('name');
		}

	setProp(p: string, v: string): void
		{
			if (this.clientEngine)
			{
				let editRoot = this.startLocalEdit();
				let metaRoot = new OT.OTMapResource(MetaResource);
				editRoot.edits.push(metaRoot);
				metaRoot.edits.push([ OT.OpMapSet, p, v ]);
				this.clientEngine.addLocal(editRoot);
			}
		}

	setType(v: string): void
		{
			this.setProp('type', v);
		}

	setName(v: string): void
		{
			this.setProp('name', v);
		}

	get bInSession(): boolean
		{
			return this.clientEngine != null;
		}

	get bPendingConnection(): boolean
		{
			return this.baPending[ReqCreate] || this.baPending[ReqJoin];
		}

	setReachable(b: boolean): void
		{
			if (b != this.bReachable)
			{
				this.bReachable = b;
				this.parent.notifyStatusChange();
			}
		}

	setFull(b: boolean): void
		{
			if (b != this.bFull)
			{
				this.bFull = b;
				this.parent.notifyStatusChange();
			}
		}

	startLocalEdit(): OT.OTCompositeResource
		{
			return new OT.OTCompositeResource(this.sessionID, this.parent.clientID);
		}

	addLocal(edit: OT.OTCompositeResource): void
		{
			if (this.clientEngine)
			{
				this.clientEngine.addLocal(edit);
				this.tick();
				this.parent.notifyData();
			}
		}

	start(req: number): void
		{
			// ReqEdit is a special pseudo-request that maps to ReqSendEdit or ReqReceiveEdit
			if (req == ReqEdit)
			{
				if (this.clientEngine && this.clientEngine.isPending())
					this.start(ReqSendEdit);
				else
					this.start(ReqReceiveEdit);
				return;
			}

			// If we've already launched this operation, ignore
			if (this.baPending[req])
				return;

			// If we're not creating and we have no session, ignore
			if (req != ReqCreate && req != ReqUser && this.sessionID == '')
				return;

			// Note we have fired this request
			this.baPending[req] = true;

			let css: ClientSessionState = this;

			switch (req)
			{
				case ReqUser:
					$.post("/api/sessions/userview")
						.done(function(result) { css.done(ReqUser, result); })
						.fail(function() { css.fail(ReqUser); })
						.always(function() { css.complete(ReqUser); })
					break;

				case ReqCreate:
					{
						this.setReachable(false);
						this.setFull(false);
						let data: any = { };
						$.ajax("/api/sessions/create",
							{
								"method": "POST",
								"contentType": "application/json; charset=UTF-8",
								"data": JSON.stringify(data),
								"processData": false,
								"dataType": "json"
							})
						.done(function(result) { css.done(ReqCreate, result); })
						.fail(function() { css.fail(ReqCreate); })
						.always(function() { css.complete(ReqCreate); })
					}
					break;

				case ReqJoin:
					{
						let data: any = { clientID: this.parent.clientID };
						$.ajax("/api/sessions/connect/" + this.sessionID,
							{
								"method": "POST",
								"contentType": "application/json; charset=UTF-8",
								"data": JSON.stringify(data),
								"processData": false,
								"dataType": "json"
							})
							.done(function(result) { css.done(ReqJoin, result); })
							.fail(function() { css.fail(ReqJoin); })
							.always(function() { css.complete(ReqJoin); })
					}
					break;

				case ReqSendEdit:
					{
						let edit: OT.OTCompositeResource = this.clientEngine.getPending();
						let data: any = { clientID: this.clientEngine.clientID, "Edit": edit.toJSON() };
						$.ajax("/api/sessions/sendevent/" + this.sessionID,
							{
								"method": "POST",
								"contentType": "application/json; charset=UTF-8",
								"data": JSON.stringify(data),
								"processData": false,
								"dataType": "json"
							})
							.done(function(result) { css.done(ReqSendEdit, result); })
							.fail(function() { css.fail(ReqSendEdit); })
							.always(function() { css.complete(ReqSendEdit); })
					}
					break;

				case ReqReceiveEdit:
					{
						$.ajax("/api/sessions/receiveevent/" + this.sessionID,
							{
								"method": "POST",
								"data": JSON.stringify({ clientID: this.clientEngine.clientID,
														 "NextClock": this.clientEngine.serverClock() + 1 }),
								"contentType": "application/json; charset=UTF-8",
								"processData": false,
								"dataType": "json"
							})
							.done(function(result) { css.done(ReqReceiveEdit, result); })
							.fail(function() { css.fail(ReqReceiveEdit); })
							.always(function() { css.complete(ReqReceiveEdit); })
					}
					break;
			}
		}

	done(req: number, result?: any)
		{
			// Successful response from server - we're connected
			this.parent.setConnected(true);

			// If this request is not pending, it got canceled - ignore
			if (! this.baPending[req])
				return;

			// Check for odd result code
			if (result === undefined || result.result === undefined)
			{
				this.parent.context.log(1, "Create session succeeded but no result status.");
				return;
			}
			let nResult: number = result.result;

			switch (req)
			{
				case ReqUser:
					if (nResult != 0)
						this.parent.context.log(1, "user view succeeded but non-zero result status: " + String(nResult));
					else if (result.user)
					{
						this.parent.user = result.user;
						this.parent.notifyStatusChange();
						this.parent.notifyJoin();
					}
					break;

				case ReqCreate:
					if (nResult != 0)
						this.parent.context.log(1, "Create session succeeded but non-zero result status: " + String(nResult));
					else
					{
						this.setReachable(true);
						this.setFull(false);
						this.sessionView = result.view;
						this.sessionID = this.sessionView.sessionID;
						this.parent.sessions[this.sessionID] = this;

						// And immediately join
						this.tick();
					}
					break;

				case ReqJoin:
					if (nResult == 2)
					{
						this.setFull(true);
						this.parent.context.log(1, "Join session succeeded but non-zero result status: " + String(nResult));
					}
					else
					{
						this.setFull(false);
						this.parent.clientID = result.clientID;
						this.sessionView = result.view;
						this.clientEngine = new OT.OTClientEngine(this.parent.context, this.sessionID, this.parent.clientID);

						// OK, now let any registered observers know about the new session
						this.parent.notifyJoin();

						// And immediately send pending edits
						this.tick();
					}
					break;

				case ReqSendEdit:
				case ReqReceiveEdit:
					{
						this.setReachable(true);
						this.setFull(false);
						if (nResult != OT.clockSuccess)
						{
							switch (nResult)
							{
								case 1:
									// "No such session"
									this.setReachable(false);
									break;
								case OT.clockInitialValue:
									// Ooops, need a reset
									this.clientEngine.initialize();
									break;
								case OT.clockSeenValue:
									// I already sent event - probably lost response from server but I should eventually see ack.
									break;
								case OT.clockFailureValue:
									// Server didn't have old clock value needed to transform my event request. Just resend with
									// more recent clock value.
									this.clientEngine.resetPending();
									break;
								default:
									// Unknown error - reset and reinitialize
									this.clientEngine.initialize();
							}
						}
						else
						{
							let aEdits: Array<any> = result.EditList;
							if (aEdits && aEdits.length > 0)
							{
								for (let j: number = 0; j < aEdits.length; j++)
								{
									let a: OT.OTCompositeResource = OT.OTCompositeResource.constructFromObject(aEdits[j]);
									this.clientEngine.addRemote(a);
								}

								// OK, now let any registered observers know about the new updates
								this.parent.notifyData();

								// Received edits - speed up pace of requests
								this.parent.speed.speedUp();
							}
							else
							{
								// Slow down requests since I got no edits from service
								this.parent.speed.slowDown();
							}
						}
					}
					break;
			}
		}

	cancel(req?: number): void
		{
			if (req === undefined)
				for (let i: number = 0; i < NRequestTypes; i++) this.baPending[i] = false;
			else
				this.baPending[req] = false;
		}

	fail(req: number): void
		{
			this.baPending[req] = false;
			this.parent.setConnected(false);
			this.setReachable(false);
			this.setFull(false);
		}

	complete(req: number): void
		{
			this.baPending[req] = false;
		}

	tick(): void
		{
			// If we don't have a user, fetch it
			if (this.parent.user.name === undefined && !this.baPending[ReqUser])
				this.start(ReqUser);

			// If was full, keep trying to join, but not too aggressively
			if (this.bFull)
			{
				this.parent.speed.slowDown();
				this.start(ReqJoin);
			}

			// Otherwise if we are connected to a session, send along any edits
			else if (this.clientEngine)
			{
				// If type not set, set it now
				if (this.pendingType != '')
				{
					this.setType(this.pendingType);
					this.pendingType = '';
				}
				this.start(ReqEdit);
			}

			// Otherwise if we have a session, join it
			else if (this.sessionID != '' && !this.baPending[ReqJoin])
				this.start(ReqJoin);

			// If we have no session, and we want one of a specific type, create one
			else if (this.sessionID == '' && this.pendingType != '' && !this.baPending[ReqCreate])
				this.start(ReqCreate);
		}

}

export class ClientSession
{
	context: OT.IExecutionContext;
	session: ClientSessionState;
	sessions: any;
	clientID: string;
	bConnected: boolean;

	// User properties
	user: any;

	// Manage speed of server interaction
	speed: SpeedManager;

	// Registered observers
	onDataList: any;
	onJoinList: any;
	onStatusList: any;

	constructor(ctx: OT.IExecutionContext)
		{
			this.context = ctx;
			this.session = new ClientSessionState(this);
			this.sessions = {};
			this.clientID = '';
			this.bConnected = true;	// Fact that page was loaded means we were initially connected

			this.user = {};

			this.speed = new SpeedManager();

			this.onDataList = {};
			this.onJoinList = {};
			this.onStatusList = [];
		}

	get bInSession(): boolean
		{
			return this.session.bInSession;
		}

	get bPendingConnection(): boolean
		{
			return this.session.bPendingConnection;
		}

	onData(resourceName: string, cb: any): void
		{
			let aCB: any = this.onDataList[resourceName];
			if (aCB === undefined)
			{
				aCB = [];
				this.onDataList[resourceName] = aCB;
			}
			aCB.push(cb);
		}

	onJoin(resourceName: string, cb: any): void
		{
			let aCB: any = this.onJoinList[resourceName];
			if (aCB === undefined)
			{
				aCB = [];
				this.onJoinList[resourceName] = aCB;
			}
			aCB.push(cb);
		}

	onStatusChange(cb: any): void
		{
			this.onStatusList.push(cb);
		}

	notifyStatusChange(): void
		{
			for (let i: number = 0; i < this.onStatusList.length; i++)
				(this.onStatusList[i])(this);
		}

	notifyJoin(): void
		{
			// OK, let any registered observers know about the session change
			for (var p in this.onJoinList)
				if (this.onJoinList.hasOwnProperty(p))
				{
					let aCB: any = this.onJoinList[p];
					for (let i: number = 0; i < aCB.length; i++) (aCB[i])(this);
				}
		}

	notifyData(): void
		{
			// OK, now let any registered observers know about the new updates
			if (this.session.clientEngine)
			{
				let objVal: any = this.session.clientEngine.toValue();
				for (var p in objVal)
				{
					if (objVal.hasOwnProperty(p) && this.onDataList[p] != undefined)
					{
						let aCB: any = this.onDataList[p];
						for (let i: number = 0; i < aCB.length; i++) (aCB[i])(this, objVal[p]);
					}

					// Cache meta information in the session
					if (p == MetaResource)
						this.session.meta = objVal[p];
				}
			}
			else
			{
				for (var p in this.onDataList) if (this.onDataList.hasOwnProperty(p))
				{
					let aCB: any = this.onDataList[p];
					for (let i: number = 0; i < aCB.length; i++) (aCB[i])(this, undefined);
				}
			}
		}
	
	setConnected(b: boolean): void
		{
			if (b != this.bConnected)
			{
				this.bConnected = b;
				this.notifyStatusChange();
			}
		}

	tick(): void
		{
			this.session.tick();
		}

	setSession(sessionID: string): void
		{
			if (sessionID == '')
				this.session = new ClientSessionState(this);
			else
			{
				this.session = this.sessions[sessionID];
				if (this.session === undefined)
				{
					this.session = new ClientSessionState(this);
					this.session.sessionID = sessionID;
					this.sessions[sessionID] = this.session;
				}
			}
			this.notifyJoin();
			this.notifyData();
			this.tick();
		}

	reset(pendingType: string): void
		{
			this.session.cancel();
			this.session = new ClientSessionState(this);
			this.session.pendingType = pendingType;
			if (pendingType == '') this.user = {}; // forces refresh with fresh data
			this.notifyJoin();
			this.notifyData();
			this.notifyStatusChange();
			this.tick();
		}
}
