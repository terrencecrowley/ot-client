import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";

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

const PhaseStart: number = 0;
const PhaseDone: number = 1;
const PhaseFail: number = 2;
const PhaseComplete: number = 3;

export class ClientSession
{
	context: OT.IExecutionContext;
	sessionID: string;
	sessionView: any;
	pendingType: string;
	clientID: string;
	clientEngine: OT.OTClientEngine;
	bConnected: boolean;
	bReachable: boolean;
	bFull: boolean;
	baPending: boolean[];

	// User properties
	user: any;

	// Track changes in state
	nStateStamp: number;

	// Manage speed of server interaction
	speed: SpeedManager;

	// Registered observers
	onChangeList: any;
	onJoinList: any;
	onStatusList: any;

	constructor(ctx: OT.IExecutionContext)
		{
			this.context = ctx;
			this.sessionID = '';
			this.sessionView = {};
			this.pendingType = '';
			this.clientID = '';
			this.clientEngine = null;
			this.bConnected = true;	// Fact that page was loaded means we were initially connected
			this.bReachable = false;
			this.bFull = false;
			this.baPending = [];
			for (let i: number = 0; i < NRequestTypes; i++) this.baPending[i] = false;

			this.user = {};

			this.nStateStamp = 0;

			this.speed = new SpeedManager();

			this.onChangeList = {};
			this.onJoinList = {};
			this.onStatusList = [];
		}

	get bInSession(): boolean
		{
			return this.clientEngine != null;
		}

	get bPendingConnection(): boolean
		{
			return this.baPending[ReqCreate] || this.baPending[ReqJoin];
		}

	onChange(resourceName: string, cb: any): void
		{
			let aCB: any = this.onChangeList[resourceName];
			if (aCB === undefined)
			{
				aCB = [];
				this.onChangeList[resourceName] = aCB;
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

	notifyChange(): void
		{
			// OK, now let any registered observers know about the new updates
			let objVal: any = this.clientEngine.toValue();
			for (var p in objVal)
				if (objVal.hasOwnProperty(p) && this.onChangeList[p] != undefined)
				{
					let aCB: any = this.onChangeList[p];
					for (let i: number = 0; i < aCB.length; i++) (aCB[i])(this, objVal[p]);
				}
		}
	
	setReachable(b: boolean): void
		{
			if (b != this.bReachable)
			{
				this.bReachable = b;
				this.notifyStatusChange();
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

	setFull(b: boolean): void
		{
			if (b != this.bFull)
			{
				this.bFull = b;
				this.notifyStatusChange();
			}
		}

	tick(): void
		{
			// If we don't have a user, fetch it
			if (this.user.name === undefined && !this.baPending[ReqUser])
				this.start(ReqUser);

			// If was full, keep trying to join, but not too aggressively
			if (this.bFull)
			{
				this.speed.slowDown();
				this.start(ReqJoin);
			}

			// Otherwise if we are connected to a session, send along any edits
			else if (this.clientEngine)
				this.start(ReqEdit);

			// Otherwise if we have a session, join it
			else if (this.sessionID != '' && !this.baPending[ReqJoin])
				this.start(ReqJoin);

			// If we have no session, and we want one of a specific type, create one
			else if (this.sessionID == '' && this.pendingType != '' && !this.baPending[ReqCreate])
				this.start(ReqCreate);
		}

	setSession(sessionID: string): void
		{
			this.sessionID = sessionID;
			this.tick();
		}

	reset(pendingType: string): void
		{
			this.cancel();
			this.sessionID = '';
			this.sessionView = {};
			if (pendingType == '')
				this.user = {};	// force user refetch so we render with fresh data
			this.pendingType = pendingType;
			this.clientEngine = null;
			this.nStateStamp++;
			this.notifyJoin();
			this.notifyStatusChange();
			this.tick();
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

			let cs: ClientSession = this;

			switch (req)
			{
				case ReqUser:
					$.post("/api/sessions/userview")
						.done(function(result) { cs.done(ReqUser, result); })
						.fail(function() { cs.fail(ReqUser); })
						.always(function() { cs.complete(ReqUser); })
					break;

				case ReqCreate:
					{
						this.setReachable(false);
						this.setFull(false);
						let data: any = { sessionType: this.pendingType };
						$.ajax("/api/sessions/create",
							{
								"method": "POST",
								"contentType": "application/json; charset=UTF-8",
								"data": JSON.stringify(data),
								"processData": false,
								"dataType": "json"
							})
						.done(function(result) { cs.done(ReqCreate, result); })
						.fail(function() { cs.fail(ReqCreate); })
						.always(function() { cs.complete(ReqCreate); })
					}
					break;

				case ReqJoin:
					{
						let data: any = { clientID: this.clientID };
						$.ajax("/api/sessions/connect/" + this.sessionID,
							{
								"method": "POST",
								"contentType": "application/json; charset=UTF-8",
								"data": JSON.stringify(data),
								"processData": false,
								"dataType": "json"
							})
							.done(function(result) { cs.done(ReqJoin, result); })
							.fail(function() { cs.fail(ReqJoin); })
							.always(function() { cs.complete(ReqJoin); })
					}
					break;

				case ReqSendEdit:
					{
						let edit: OT.OTCompositeResource = this.clientEngine.getPending();
						let data: any = { "clientID": edit.clientID, "Edit": edit.toJSON() };
						$.ajax("/api/sessions/sendevent/" + this.sessionID,
							{
								"method": "POST",
								"contentType": "application/json; charset=UTF-8",
								"data": JSON.stringify(data),
								"processData": false,
								"dataType": "json"
							})
							.done(function(result) { cs.done(ReqSendEdit, result); })
							.fail(function() { cs.fail(ReqSendEdit); })
							.always(function() { cs.complete(ReqSendEdit); })
					}
					break;

				case ReqReceiveEdit:
					{
						$.ajax("/api/sessions/receiveevent/" + this.sessionID,
							{
								"method": "POST",
								"data": JSON.stringify({ "clientID": this.clientEngine.clientID,
														 "NextClock": this.clientEngine.serverClock() + 1 }),
								"contentType": "application/json; charset=UTF-8",
								"processData": false,
								"dataType": "json"
							})
							.done(function(result) { cs.done(ReqReceiveEdit, result); })
							.fail(function() { cs.fail(ReqReceiveEdit); })
							.always(function() { cs.complete(ReqReceiveEdit); })
					}
					break;
			}
		}

	done(req: number, result?: any)
		{
			this.nStateStamp++;

			// Successful response from server - we're connected
			this.setConnected(true);

			// If this request is not pending, it got canceled - ignore
			if (! this.baPending[req])
				return;

			// Check for odd result code
			if (result === undefined || result.result === undefined)
			{
				this.context.log(1, "Create session succeeded but no result status.");
				return;
			}
			let nResult: number = result.result;

			switch (req)
			{
				case ReqUser:
					if (nResult != 0)
						this.context.log(1, "user view succeeded but non-zero result status: " + String(nResult));
					else if (result.user)
					{
						this.user = result.user;
						this.notifyStatusChange();
					}
					break;

				case ReqCreate:
					if (nResult != 0)
						this.context.log(1, "Create session succeeded but non-zero result status: " + String(nResult));
					else
					{
						this.setReachable(true);
						this.setFull(false);
						this.sessionView = result.view;
						this.sessionID = this.sessionView.sessionID;
						this.pendingType = '';

						// And immediately join
						this.tick();
					}
					break;

				case ReqJoin:
					if (nResult == 2)
					{
						this.setFull(true);
						this.context.log(1, "Join session succeeded but non-zero result status: " + String(nResult));
					}
					else
					{
						this.setFull(false);
						this.clientID = result.clientID;
						this.sessionView = result.view;
						this.clientEngine = new OT.OTClientEngine(this.context, this.sessionID, this.clientID);
						if (result.userName)
						{
							// TODO: Delete: Should no longer be necessary with real user info
							if (this.user.name === undefined)
								this.user.name = result.userName;
						}

						// OK, now let any registered observers know about the new session
						this.notifyJoin();

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
								this.notifyChange();

								// Received edits - speed up pace of requests
								this.speed.speedUp();
							}
							else
							{
								// Slow down requests since I got no edits from service
								this.speed.slowDown();
							}
						}
					}
					break;
			}
		}

	cancel(req?: number): void
		{
			this.nStateStamp++;

			if (req === undefined)
				for (let i: number = 0; i < NRequestTypes; i++) this.baPending[i] = false;
			else
				this.baPending[req] = false;
		}

	fail(req: number): void
		{
			this.nStateStamp++;

			this.baPending[req] = false;
			this.setConnected(false);
			this.setReachable(false);
			this.setFull(false);
		}

	complete(req: number): void
		{
			this.nStateStamp++;

			this.baPending[req] = false;
		}
}
