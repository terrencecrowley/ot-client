import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as ClientActions from "./clientactions";

export class ChatControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	chatArray: any;		// array of [userID, chat string] tuples
	userMap: any;		// User names indexed by clientID
	bChatOn: boolean;
	nChatSeen: number;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.chatArray = [];
			this.userMap = {};
			this.bChatOn = false;
			this.nChatSeen = 0;
			this.handleState = this.handleState.bind(this);
			cs.on('state', this.handleState);
			this.notifyLocalChange = this.notifyLocalChange.bind(this);
		}

	get chatDisabled(): boolean
		{
			return ! this.clientSession.bInSession;
		}

	navText(): string
		{
			if (this.chatDisabled)
				return "Chat Unavailable";
			else
			{
				let chatString: string = this.bChatOn ? "Hide Chat" : "Chat";
				let nChatUnseen: number = this.bChatOn ? 0 : this.chatArray.length - this.nChatSeen;
				if (nChatUnseen > 0)
					chatString += "(" + String(nChatUnseen) + ")";
				return chatString;
			}
		}

	reset(): void
		{
			this.chatArray = [];
			this.userMap = {};
			this.bChatOn = false;
			this.nChatSeen = 0;
			this.reRender();
		}

	toggle(): void
		{
			if (! this.chatDisabled)
			{
				this.bChatOn = ! this.bChatOn;
				this.nChatSeen = this.chatArray.length; // Either way (before or after) everything current is seen
				this.reRender();
			}
		}

	handleState(cs: CS.ClientSession, css: CS.ClientSessionState)
		{
			if (css == null || css.state == null || css.state['chat'] == null)
				this.reset();
			else
			{
				this.chatArray = css.state['chat'];
				if (this.bChatOn)
					this.nChatSeen = this.chatArray.length;
				this.userMap = css.state['WellKnownName_users'];
			}
			this.reRender();
		}

	doneEdits(ok: boolean): void
		{
		}

	notifyLocalChange(s: string): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.bInSession)
			{
				let editRoot: OT.OTCompositeResource = css.startLocalEdit();
				let editChat: OT.OTArrayResource = new OT.OTArrayResource('chat');
				editChat.edits.push([ OT.OpRetain, this.chatArray.length, [ [ ] ] ]);
				editChat.edits.push([ OT.OpInsert, 1, [ [ css.clientID, s ] ] ]);
				editRoot.edits.push(editChat);
				css.addLocal(editRoot);
				this.reRender();
			}
		}

}
