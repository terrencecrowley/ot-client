import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";

export class ChatControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;

	chatArray: any;		// array of [userID, chat string] tuples
	userMap: any;		// User names indexed by clientID
	bChatOn: boolean;
	nChatSeen: number;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;

			this.chatArray = [];
			this.userMap = {};
			this.bChatOn = false;
			this.nChatSeen = 0;
			this.notifyChatChange = this.notifyChatChange.bind(this);
			this.notifyUserChange = this.notifyUserChange.bind(this);
			this.notifyLocalChange = this.notifyLocalChange.bind(this);
			cs.onChange('chat', this.notifyChatChange);
			cs.onChange('WellKnownName_users', this.notifyUserChange);
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
			this.bChatOn = ! this.bChatOn;
			this.nChatSeen = this.chatArray.length; // Either way (before or after) everything current is seen
			this.reRender();
		}

	notifyChatChange(cs: CS.ClientSession, chatArray: any)
		{
			this.chatArray = chatArray;
			if (this.bChatOn)
				this.nChatSeen = this.chatArray.length;
			this.reRender();
		}

	notifyUserChange(cs: CS.ClientSession, userMap: any)
		{
			this.userMap = userMap;
			this.reRender();
		}

	notifyLocalChange(s: string): void
		{
			let cs: CS.ClientSession = this.clientSession;
			if (cs.clientEngine)
			{
				let editRoot: OT.OTCompositeResource = new OT.OTCompositeResource(cs.sessionID, cs.clientID);
				let editChat: OT.OTArrayResource = new OT.OTArrayResource('chat');
				editChat.edits.push([ OT.OpRetain, this.chatArray.length, [ [ ] ] ]);
				editChat.edits.push([ OT.OpInsert, 1, [ [ cs.clientID, s ] ] ]);
				editRoot.edits.push(editChat);
				cs.clientEngine.addLocal(editRoot);
				cs.tick();
				this.reRender();
			}
		}

}
