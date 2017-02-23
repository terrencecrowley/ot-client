import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as OTE from "@terrencecrowley/ot-editutil";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Board from "./board";
import * as SC from "./scratchcontrol";
import * as CC from "./chatcontrol";
import * as BC from "./boardcontrol";
import * as StatC from "./statuscontrol";
import * as SessionC from "./sessioncontrol";
import * as CS from "./clientsession";
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

class App
{
	context: BrowserContext;
	clientSession: CS.ClientSession;

	statusControl: StatC.StatusControl;
	sessionControl: SessionC.SessionControl;
	scratchControl: SC.ScratchControl;
	chatControl: CC.ChatControl;
	boardControl: BC.BoardControl;

	// For rendering
	bRender: boolean;

	// constructor
	constructor()
		{
			this.context = new BrowserContext();
			this.clientSession = new CS.ClientSession(this.context);
			this.forceRender = this.forceRender.bind(this);

			this.bRender = false;

			this.statusControl = new StatC.StatusControl(this.context, this.clientSession, this.forceRender);
			this.sessionControl = new SessionC.SessionControl(this.context, this.clientSession, this.forceRender);
			this.scratchControl = new SC.ScratchControl(this.context, this.clientSession, this.forceRender);
			this.chatControl = new CC.ChatControl(this.context, this.clientSession, this.forceRender);
			this.boardControl = new BC.BoardControl(this.context, this.clientSession, this.forceRender);
		}

	render(): void
		{
			if (this.bRender)
			{
				ReactDOM.render(<ReactApp bc={this.boardControl} name={this.clientSession.user.name} url={this.urlForJoin} status={this.statusControl.status} newCB={newCB} cc={this.chatControl} chatCB={chatCB} />,
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
			if (this.clientSession.sessionID != '')
			{
				s = document.location.protocol + '//' + document.location.hostname;
				if (document.location.port)
					s += ':' + document.location.port;
				s += '/join/' + this.clientSession.sessionID;
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

	newBoard(): void
		{
			this.clientSession.reset();
			this.chatControl.reset();
			this.boardControl.reset();
		}

	toggleChat(): void
		{
			this.chatControl.toggle();
			this.forceRender();
		}

	tick(): void
		{
			this.clientSession.tick();
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

function StartupApp()
{
	theApp = new App();
	theApp.initialize();
}


$ ( StartupApp );
