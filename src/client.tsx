import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as OTE from "@terrencecrowley/ot-editutil";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Board from "./board";
import { ReactApp } from "./components/app";

// Helper function for setting range of a textarea.
function selectRange(el: any, start: any, end: any) {
        if('selectionStart' in el) {
            el.selectionStart = start;
            el.selectionEnd = end;
        } else if(el.setSelectionRange) {
            el.setSelectionRange(start, end);
        } else if(el.createTextRange) {
            let range: any = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    }

class BrowserContext implements OT.IExecutionContext
{
	constructor()
		{
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
			// logMessage(s);
		}
};

class SpeedManager
{
	private _Speed: number;
	private _SlowCounter: number;

	get speed() { return this._Speed; }

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
};

class App
{
	UserName: string;
	Url: string;
	Status: string;
	usersValue: any;	// map of <userID, userName> pairs
	chatArray: any;		// array of [userID, chat string] tuples

	elTextArea: any;
	textValue: string;
	selectionStart: number;
	selectionEnd: number;

	isConnected: boolean;
	isSessionReachable: boolean;
	isSessionFull: boolean;
	isPendingList: boolean;
	isPendingCreate: boolean;
	isPendingJoin: boolean;
	isPendingSendEdits: boolean;
	isPendingReceiveEdits: boolean;
	isAutoClient: boolean;
	isChatOn: boolean;
	nChatSeen: number;

	currentSession: string;
	clientID: string;
	clientEngine: OT.OTClientEngine;
	clientContext: BrowserContext;
	EditUtil: OTE.OTEditUtil;
	speed: SpeedManager;

	// For rendering
	doNeedRender: boolean;

	// Actual board
	board: Board.Board;

	// constructor
	constructor()
		{
			this.usersValue = { };
			this.chatArray = [ ];
			this.UserName = '';
			this.Url = '';
			this.Status = '';
			this.elTextArea = null;
			this.textValue = '';
			this.selectionStart = 0;
			this.selectionEnd = 0;
			this.doNeedRender = false;

			this.isConnected = true; // After all, we did successfully reach the page.
			this.isSessionReachable = false;
			this.isSessionFull = false;
			this.isPendingList = false;
			this.isPendingCreate = false;
			this.isPendingJoin = false;
			this.isPendingSendEdits = false;
			this.isPendingReceiveEdits = false;
			this.isChatOn = false;
			this.nChatSeen = 0;

			this.isAutoClient = false;
			this.currentSession = '';
			this.clientID = '';
			this.clientEngine = null;
			this.clientContext = new BrowserContext();
			this.EditUtil = new OTE.OTEditUtil(this.clientContext, this.currentSession, this.clientID, 'text');
			this.speed = new SpeedManager();
			this.board = new Board.Board();
		}

	render(): void
		{
			if (this.doNeedRender)
			{
				ReactDOM.render(<ReactApp board={this.board} clickSquare={clickSquareCB} name={this.UserName} url={this.Url} status={this.Status} captureElementCB={captureElementCB} contentChangeCB={contentChangeCB} nameChangeCB={nameChangeCB} newCB={newCB} submitChatCB={submitChatCB} chatCB={chatCB} isChatOn={this.isChatOn} nChatSeen={this.nChatSeen} clientID={this.clientID} chatArray={this.chatArray} users={this.usersValue} />,
					document.getElementById("root"));
				this.doNeedRender = false;
			}
		}

	needRender(): void
		{
			if (! this.doNeedRender)
			{
				this.doNeedRender = true;
				setTimeout(function() { theApp.render(); }, 1);
			}
		}

	setConnected(b: boolean): void
		{
			if (this.isConnected != b)
			{
				this.isConnected = b;
				this.setStatus();
			}
		}

	setStatus(): void
		{
			let newStatus: string;
			if (! this.isConnected)
				newStatus = "Server unreachable.";
			else if (this.isInSession())
			{
				if (this.isSessionReachable)
				{
					let nAnon: number = 0;
					let nOther: number = 0;
					for (var cid in this.usersValue)
						if (this.usersValue.hasOwnProperty(cid) && cid != this.clientID)
						{
							nOther++;
							if (this.usersValue[cid] == '')
								nAnon++;
						}
					if (nOther == 0)
						newStatus = "Connected, no other authors.";
					else
					{
						let statusBuild: string[] = [];
						statusBuild.push('Connected with ');
						if (nOther > nAnon)
						{
							let nNames: number = nOther - nAnon;
							let sFinalCombiner: string = nAnon == 0 ? ' and ' : ', ';
							for (var cid in this.usersValue)
								if (this.usersValue.hasOwnProperty(cid) && cid != this.clientID && this.usersValue[cid] != '')
								{
									statusBuild.push(this.usersValue[cid]);
									nNames--;
									if (nNames == 1)
										statusBuild.push(sFinalCombiner);
									else if (nNames > 1)
										statusBuild.push(', ');
								}
							if (nAnon > 0)
								statusBuild.push(' and ');
						}
						statusBuild.push(nAnon == 0 ? '.' : (nAnon == 1 ? 'one other user.' : String(nAnon) + ' other users.'));

						newStatus = statusBuild.join('');
					}
				}
				else
					newStatus = "Session unavailable.";
			}
			else if (this.isSessionFull)
				newStatus = "Session full, please wait.";
			else if (this.isPendingCreate || this.isPendingJoin)
				newStatus = "Connecting to session...";
			else
				newStatus = "No current session.";

			// Only re-render as necessary
			if (newStatus != this.Status)
			{
				this.Status = newStatus;
				this.needRender();
			}
		}

	shareUserName(): void
	{
		if (this.isInSession())
		{
			if (this.usersValue[this.clientID] == null || this.usersValue[this.clientID] != this.UserName)
			{
				let editRoot: OT.OTCompositeResource = new OT.OTCompositeResource(this.currentSession, this.clientID);
				let editMap: OT.OTMapResource = new OT.OTMapResource('WellKnownName_users');
				editMap.edits.push([ OT.OpMapSet, this.clientID, this.UserName ]);
				editRoot.edits.push(editMap);
				this.clientEngine.addLocal(editRoot);
				this.fireEdits();
			}
		}
	}

	submitChat(s: string): void
		{
			if (this.isInSession())
			{
				let editRoot: OT.OTCompositeResource = new OT.OTCompositeResource(this.currentSession, this.clientID);
				let editChat: OT.OTArrayResource = new OT.OTArrayResource('chat');
				editChat.edits.push([ OT.OpRetain, this.chatArray.length, [ [ ] ] ]);
				editChat.edits.push([ OT.OpInsert, 1, [ [ this.clientID, s ] ] ]);
				editRoot.edits.push(editChat);
				this.clientEngine.addLocal(editRoot);
				this.fireEdits();
			}
		}

	setUserName(s: string): void
		{
			if (this.UserName !== s)
			{
				this.UserName = s;
				this.shareUserName();
				this.needRender();
			}
		}

	setUrl(): void
		{
			let s: string = '';
			if (this.currentSession != '')
			{
				s = document.location.protocol + '//' + document.location.hostname;
				if (document.location.port)
					s += ':' + document.location.port;
				s += '/join/' + this.currentSession;
			}
			if (this.Url !== s)
			{
				this.Url = s;
				this.needRender();
			}
		}

	setTextValue(s: string, selectionStart?: number, selectionEnd?: number): void
		{
			this.textValue = s;
			if (selectionStart !== undefined)
				this.selectionStart = selectionStart;
			if (selectionEnd !== undefined)
				this.selectionEnd = selectionEnd;
			if (this.elTextArea.value !== this.textValue
				|| this.elTextArea.selectionStart != this.selectionStart
				|| this.elTextArea.selectionEnd != this.selectionEnd)
			{
				this.elTextArea.value = s;
				selectRange(this.elTextArea, this.selectionStart, this.selectionEnd);
			}
		}

	isInSession(): boolean
		{
			return this.clientEngine != null;
		}

	reTick(): void
		{
			setTimeout( function() { theApp.tick(); }, this.speed.speed);
		}

	Initialize(): void
		{
			if (document.location.pathname === "/")
				this.currentSession = document.location.pathname.substr(1);
			else
				this.currentSession = document.location.pathname.substr(6); // Remove "/join/"
			this.setUrl();
			if (this.currentSession !== '')
				this.fireJoin();
			else
				this.fireCreate();
			this.isAutoClient = false;
			this.needRender();
			this.reTick();
		}

	newBoard(): void
		{
			this.cancelEdits();
			this.cancelCreate();
			this.cancelJoin();
			this.currentSession = '';
			this.clientID = '';
			this.clientEngine = null;
			this.usersValue = { };
			this.chatArray = [ ];
			this.isChatOn = false;
			this.nChatSeen = 0;
			this.board = new Board.Board();
			this.fireCreate();
		}

	toggleChat(): void
		{
			this.isChatOn = ! this.isChatOn;
			this.nChatSeen = this.chatArray.length; // either now or before
			this.needRender();
		}

	clickSquare(id: number): void
		{
			// If no square is selected
			//	AND there is a piece at the clicked location
			//	AND it is the color who gets to move
			//	THEN set it as the selected square
			// If a square is selected
			//	AND the clicked square is one of the legal target squares
			//	THEN move the selected piece to the clicked square
			// Else If a square is selected
			//	AND there is a piece at the clicked location
			//	AND it is the color who gets to move
			//	THEN set it as the selected square
			if (this.board.isTargeted(id))
			{
				this.board.move(this.board.selected, id);
				this.board.setSelected(-1);
			}
			else
				this.board.setSelected(id);
			this.needRender();
		}

	// events are: 'start', 'succeed', 'fail', 'complete'
	onList(event: string, result?: any): void
		{
			switch (event)
			{
				case 'start':
					if (! this.isPendingList)
					{
						this.isPendingList = true;
						$.getJSON("/api/sessions")
							.done(function(data) { theApp.onList('succeed', data); })
							.fail(function() { theApp.onList('fail'); })
							.always(function() { theApp.onList('complete'); });
					}
					break;
				case 'succeed':
					this.setConnected(true);
					if (result.result == null)
						this.clientContext.log(1, "List session succeeded but expected result status.");
					else if (result.result != 0)
						this.clientContext.log(1, "List session succeeded but result status is " + String(result.result));
					else 
					{
						let sessionList: Array<any> = result.sessions;
						let $select: any = $("#sessions");
						$select.empty();
						if (sessionList.length == 0)
							$select.append($('<option />').attr('value', "none").html("No sessions."));
						else
							//for (let i: number = 0; i < sessionList.length; i++)
							for (let i in sessionList)
								$select.append($('<option />').attr('value', (sessionList[i])["session_id"]).html("" + i));
					}
					break;
				case 'fail':
					this.setConnected(false);
					break;
				case 'complete':
					this.isPendingList = false;
					break;
			}
			this.setStatus();
		}

	onCreate(event: string, result?: any): void
		{
			switch (event)
			{
				case 'start':
					if (! this.isPendingCreate)
					{
						this.isPendingCreate = true;
						this.isSessionReachable = false;
						this.isSessionFull = false;
						$.post("/api/sessions/create")
							.done(function(data) { theApp.onCreate('succeed', data); })
							.fail(function() { theApp.onCreate('fail'); })
							.always(function() { theApp.onCreate('complete'); })
					}
					break;
				case 'succeed':
					this.setConnected(true);
					if (result.result == null)
						this.clientContext.log(1, "Create session succeeded but expected result status.");
					else if (result.result != 0)
						this.clientContext.log(1, "Create session succeeded but result status is " + String(result.result));
					else
					{
						this.isSessionReachable = true;
						this.isSessionFull = false;
						this.currentSession = result.session_id;
						this.EditUtil.resourceID = this.currentSession;
						this.setUrl();
						this.clientContext.log(2, "Create session succeeded: " + String(result.session_id));
					}
					this.fireJoin();
					break;
				case 'fail':
					this.setConnected(false);
					break;
				case 'complete':
					this.isPendingCreate = false;
					break;
			}
			this.setStatus();
			$("#scratchpad").prop("readonly", !this.isConnected || !this.isSessionReachable || this.isSessionFull);
		}

	onJoin(event: string, result?: any): void
		{
			switch (event)
			{
				case 'start':
					{
						if (! this.isPendingJoin && this.currentSession !== '')
						{
							this.isPendingJoin = true;
							$.post("/api/sessions/connect/" + this.currentSession)
								.done(function(data) { theApp.onJoin('succeed', data); })
								.fail(function() { theApp.onJoin('fail'); })
								.always(function() { theApp.onJoin('complete'); })
						}
					}
					break;
				case 'succeed':
					this.setConnected(true);
					if (result.result === undefined)
						this.clientContext.log(1, "Join session succeeded but expected result status.");
					else if (result.result != 0)
					{
						if (result.result == 2)
						{
							this.isSessionFull = true;
							this.isSessionReachable = true;
						}
						this.clientContext.log(1, "Join session succeeded but result status is " + String(result.result));
					}
					else
					{
						this.isSessionFull = false;
						this.isSessionReachable = true;
						this.clientID = result.clientID;
						this.EditUtil.clientID = this.clientID;
						this.clientEngine = new OT.OTClientEngine(this.clientContext, this.currentSession, this.clientID);
						if (this.UserName == '' && result.userName)
							this.setUserName(result.userName);
						else
							this.shareUserName();
						this.fireEdits();
					}
					break;
				case 'fail':
					this.setConnected(false);
					this.isSessionReachable = false;
					this.isSessionFull = false;
					break;
				case 'complete':
					this.isPendingJoin = false;
					break;
			}
			this.setStatus();
			$("#scratchpad").prop("readonly", !this.isConnected || !this.isSessionReachable || this.isSessionFull);
		}

	onEdits(event: string, result?: any): void
		{
			switch (event)
			{
				case 'start':
					if (this.clientEngine.isPending())
					{
						if (! this.isPendingSendEdits)
						{
							this.isPendingSendEdits = true;
							let edit: OT.OTCompositeResource = this.clientEngine.getPending();
							let data: any = { "clientID": edit.clientID, "Edit": edit.toJSON() };
							$.ajax("/api/sessions/sendevent/" + this.currentSession,
								{
									"method": "POST",
									"contentType": "application/json; charset=UTF-8",
									"data": JSON.stringify(data),
									"processData": false,
									"dataType": "json"
								})
								.done(function(data) { theApp.onEdits('succeed/send', data); })
								.fail(function() { theApp.onEdits('fail'); })
								.always(function() { theApp.onEdits('complete/send'); })
						}
					}
					else
					{
						if (! this.isPendingReceiveEdits)
						{
							this.isPendingReceiveEdits = true;
							$.ajax("/api/sessions/receiveevent/" + this.currentSession,
								{
									"method": "POST",
									"data": JSON.stringify({ "clientID": this.clientEngine.clientID,
															 "NextClock": this.clientEngine.serverClock() + 1 }),
									"contentType": "application/json; charset=UTF-8",
									"processData": false,
									"dataType": "json"
								})
								.done(function(data) { theApp.onEdits('succeed/receive', data); })
								.fail(function() { theApp.onEdits('fail'); })
								.always(function() { theApp.onEdits('complete/receive'); })
						}
					}
					break;
				case 'succeed/send':
				case 'succeed/receive':
					{
						let nResult: number = result ? result.result : undefined;
						this.isSessionReachable = true;
						this.isSessionFull = false;
						this.setConnected(true);
						if (nResult === undefined)
						{
							this.clientContext.log(1, "Send/receive succeeded but expected result status.");
						}
						else if (nResult != OT.clockSuccess)
						{
							switch (nResult)
							{
								case 1:
									// "No such session"
									this.isSessionReachable = false;
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
							this.needRender();
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
								let objVal: any = this.clientEngine.toValue();
								if (objVal['text'])
								{
									let cursor: any = this.EditUtil.extractCursor(this.clientEngine.stateLocal);
									cursor = cursor ? cursor[this.clientID] : undefined;
									let ss: number = cursor && cursor.selectionStart ? cursor.selectionStart : undefined;
									let se: number = cursor && cursor.selectionEnd ? cursor.selectionEnd : ss;
									this.setTextValue(objVal['text'], ss, se);
								}
								if (objVal['WellKnownName_users'])
								{
									this.usersValue = objVal['WellKnownName_users'];
									// Check if I'm in the user list, I may have been edited out for inactivity
									if (this.usersValue[this.clientID] == null)
										this.shareUserName();
								}
								if (objVal['chat'])
								{
									this.chatArray = objVal['chat'];
									if (this.isChatOn)
										this.nChatSeen = this.chatArray.length;
								}
								this.clientContext.log(2, "Events received: " + String(aEdits ? aEdits.length : 0));
								this.speed.speedUp();
								this.needRender();
							}
							else
								this.speed.slowDown();
							this.setStatus();
						}
					}
					break;
				case 'fail':
					this.clientEngine.resetPending();
					this.isSessionReachable = false;
					this.setConnected(false);
					break;
				case 'complete/send':
					this.isPendingSendEdits = false;
					break;
				case 'complete/receive':
					this.isPendingReceiveEdits = false;
					break;
			}
			this.setStatus();
		}

	fireList(): void { this.onList('start'); }
	fireCreate(): void { this.onCreate('start'); }
	fireJoin(): void { this.onJoin('start'); }
	fireEdits(): void { this.onEdits('start'); }

	cancelList(): void { this.onList('complete'); }
	cancelCreate(): void { this.onCreate('complete'); }
	cancelJoin(): void { this.onJoin('complete'); }
	cancelEdits(): void { this.onEdits('complete'); }

	tick(): void
		{
			if (this.isSessionFull)
			{
				this.speed.slowDown();
				this.fireJoin();
			}
			else if (this.isInSession())
				this.fireEdits();
			this.reTick();
		}
};

let theApp: App = null;


function newCB(): void
{
	theApp.newBoard();
}

function chatCB(): void
{
	theApp.toggleChat();
}

function submitChatCB(sChat: string): void
{
	theApp.submitChat(sChat);
}

function captureElementCB(el: any): void
{
	theApp.elTextArea = el;
}

function contentChangeCB(sNewVal: string, s: number, e: number): void
{
	if (theApp.isInSession())
	{
		let objOld: any = theApp.clientEngine.toValue();
		let sOldVal = (objOld && objOld['text']) ? objOld['text'] : '';
		if (sOldVal != sNewVal || s != theApp.selectionStart || e != theApp.selectionEnd)
		{
			let edit: OT.OTCompositeResource = theApp.EditUtil.computeEdit(sOldVal, sNewVal);
			theApp.EditUtil.injectCursor(edit, s, e);
			if (edit.length > 0)
			{
				theApp.clientEngine.addLocal(edit);
				theApp.fireEdits();
			}
		}
	}
	theApp.setTextValue(sNewVal, s, e);
}

function nameChangeCB(sNewVal: string): void
{
	theApp.setUserName(sNewVal);
}

function clickSquareCB(id: number): void
{
	theApp.clickSquare(id);
}

function StartupApp()
{
	theApp = new App();
	theApp.Initialize();
}


$ ( StartupApp );
