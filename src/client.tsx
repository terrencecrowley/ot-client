import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as OTE from "@terrencecrowley/ot-editutil";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Chess from "./chess";
import * as Plan from "./plan";
import * as ScratchControl from "./scratchcontrol";
import * as AgreeControl from "./agreecontrol";
import * as ChatControl from "./chatcontrol";
import * as NameControl from "./namecontrol";
import * as QueryControl from "./querycontrol";
import * as MenuControl from "./menucontrol";
import * as ChessControl from "./chesscontrol";
import * as PlanControl from "./plancontrol";
import * as StatusControl from "./statuscontrol";
import * as SessionC from "./sessioncontrol";
import * as CS from "@terrencecrowley/ot-clientsession";
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

				case ClientActions.NewPlan:
					this.app.actionNewPlan();
					break;

				case ClientActions.NewAgree:
					this.app.actionNewAgree();
					break;

				case ClientActions.ToggleChat:
					this.app.actionToggleChat();
					break;

				case ClientActions.JoinSession:
					this.app.actionJoinSession(arg as string);
					break;

				case ClientActions.Query:
					this.app.actionQuery(arg);
					break;

				case ClientActions.Menu:
					this.app.actionMenu(arg);
					break;

				case ClientActions.DoneEdits:
					this.app.actionDone(arg as boolean);
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
	agreeControl: AgreeControl.AgreeControl;
	chatControl: ChatControl.ChatControl;
	nameControl: NameControl.NameControl;
	chessControl: ChessControl.ChessControl;
	planControl: PlanControl.PlanControl;
	queryControl: QueryControl.QueryControl;
	menuControl: MenuControl.MenuControl;

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
			this.nameControl = new NameControl.NameControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.queryControl = new QueryControl.QueryControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.menuControl = new MenuControl.MenuControl(this.context, this.clientSession, this.forceRender, this.actions);

			this.sessionControl = new SessionC.SessionControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.scratchControl = new ScratchControl.ScratchControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.agreeControl = new AgreeControl.AgreeControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.chessControl = new ChessControl.ChessControl(this.context, this.clientSession, this.forceRender, this.actions);
			this.planControl = new PlanControl.PlanControl(this.context, this.clientSession, this.forceRender, this.actions);
		}

	render(): void
		{
			if (this.bRender)
			{
				ReactDOM.render(<ReactApp mode={this.mode()} name={this.clientSession.user.name} url={this.urlForJoin} status={this.statusControl.status} actions={this.actions} sessionControl={this.sessionControl} nameControl={this.nameControl} queryControl={this.queryControl} menuControl={this.menuControl} chatControl={this.chatControl} chessControl={this.chessControl} planControl={this.planControl} scratchControl={this.scratchControl} agreeControl={this.agreeControl}/>,
					document.getElementById("root"));
				this.bRender = false;
				if ($('#autofocus'))
					$('#autofocus').focus();
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

	actionNewPlan(): void
		{
			this.clientSession.reset('plan');
		}

	actionNewScratch(): void
		{
			this.clientSession.reset('scratch');
		}

	actionNewAgree(): void
		{
			this.clientSession.reset('agree');
		}

	actionToggleChat(): void
		{
			this.chatControl.toggle();
		}

	actionJoinSession(sid: string): void
		{
			this.clientSession.setSession(sid);
		}

	actionQuery(props: any): void
		{
			this.queryControl.query(props);
		}

	actionMenu(props: any): void
		{
			this.menuControl.menu(props);
		}

	actionDone(ok: boolean): void
		{
			this.statusControl.doneEdits(ok);
			this.sessionControl.doneEdits(ok);
			this.scratchControl.doneEdits(ok);
			this.agreeControl.doneEdits(ok);
			this.chatControl.doneEdits(ok);
			this.nameControl.doneEdits(ok);
			this.chessControl.doneEdits(ok);
			this.planControl.doneEdits(ok);
			this.queryControl.doneEdits(ok);
			this.menuControl.doneEdits(ok);
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
