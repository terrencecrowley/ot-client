import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as OTE from "@terrencecrowley/ot-editutil";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Board from "./board";
import * as ScratchControl from "./scratchcontrol";
import * as DoodleControl from "./doodlecontrol";
import * as ChatControl from "./chatcontrol";
import * as BoardControl from "./boardcontrol";
import * as StatusControl from "./statuscontrol";
import * as SessionC from "./sessioncontrol";
import * as CS from "./clientsession";
import * as ClientActions from "./clientactions";
import { ReactApp } from "./components/app";

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
}

class Actions implements ClientActions.IClientActions
{
	app: App;

	constructor(app: App)
		{
			this.app = app;
		}

	fire(id: number, arg?: any): void
		{
			switch (id)
			{
				case ClientActions.Home:
					this.app.actionHome();
					break;

				case ClientActions.NewScratch:
					this.app.actionNewScratch();
					break;

				case ClientActions.NewChess:
					this.app.actionNewChess();
					break;

				case ClientActions.NewDoodle:
					this.app.actionNewDoodle();
					break;

				case ClientActions.ToggleChat:
					this.app.actionToggleChat();
					break;

				case ClientActions.JoinSession:
					this.app.actionJoinSession(arg as string);
					break;
			}
		}
}

class App
{
	context: BrowserContext;
	clientSession: CS.ClientSession;

	statusControl: StatusControl.StatusControl;
	sessionControl: SessionC.SessionControl;
	scratchControl: ScratchControl.ScratchControl;
	doodleControl: DoodleControl.DoodleControl;
	chatControl: ChatControl.ChatControl;
	boardControl: BoardControl.BoardControl;

	// For rendering
	bRender: boolean;

	// Actions
	actions: Actions;

	// constructor
	constructor()
		{
			this.context = new BrowserContext();
			this.clientSession = new CS.ClientSession(this.context);
			this.forceRender = this.forceRender.bind(this);

			this.bRender = false;

			// Bind so I can use as generic callbacks
			this.actions = new Actions(this);

			this.statusControl = new StatusControl.StatusControl(this.context, this.clientSession, this.forceRender);
			this.chatControl = new ChatControl.ChatControl(this.context, this.clientSession, this.forceRender, this.actions);

			this.sessionControl = new SessionC.SessionControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.scratchControl = new ScratchControl.ScratchControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.doodleControl = new DoodleControl.DoodleControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.boardControl = new BoardControl.BoardControl(this.context, this.clientSession, this.forceRender, this.actions);
		}

	render(): void
		{
			if (this.bRender)
			{
				ReactDOM.render(<ReactApp mode={this.mode()} name={this.clientSession.user.name} url={this.urlForJoin} status={this.statusControl.status} actions={this.actions} sessionControl={this.sessionControl} chatControl={this.chatControl} boardControl={this.boardControl} scratchControl={this.scratchControl} doodleControl={this.doodleControl}/>,
					document.getElementById("root"));
				this.bRender = false;
			}
		}

	forceRender(): void
		{
			if (! this.bRender)
			{
				this.bRender = true;
				setTimeout(function() { theApp.render(); }, 1);
			}
		}

	get urlForJoin(): string
		{
			let s: string = '';
			if (this.clientSession.session.sessionID != '')
			{
				s = document.location.protocol + '//' + document.location.hostname;
				if (document.location.port)
					s += ':' + document.location.port;
				s += '/join/' + this.clientSession.session.sessionID;
			}
			return s;
		}

	reTick(): void
		{
			setTimeout( function() { theApp.tick(); }, this.clientSession.speed.speed);
		}

	initialize(): void
		{
			let p: string = document.location.pathname;
			let sessionID: string = '';
			if (p.length > 6 && p.substr(0, 6) === '/join/')
				sessionID = document.location.pathname.substr(6); // Remove "/join/"
			this.clientSession.setSession(sessionID);
			this.forceRender();
			this.reTick();
		}

	mode(): string
		{
			if (this.clientSession.session.getType())
				return this.clientSession.session.getType();
			return '';
		}

	actionHome(): void
		{
			this.clientSession.reset('');
		}

	actionNewChess(): void
		{
			this.clientSession.reset('chess');
		}

	actionNewScratch(): void
		{
			this.clientSession.reset('scratch');
		}

	actionNewDoodle(): void
		{
			this.clientSession.reset('doodle');
		}

	actionToggleChat(): void
		{
			this.chatControl.toggle();
		}

	actionJoinSession(sid: string): void
		{
			this.clientSession.setSession(sid);
		}

	tick(): void
		{
			this.clientSession.tick();
			this.reTick();
		}
};

let theApp: App = null;


function StartupApp()
{
	theApp = new App();
	theApp.initialize();
}


$ ( StartupApp );
