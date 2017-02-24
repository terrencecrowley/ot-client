import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as ClientActions from "./clientactions";

export class DoodleControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	userMap: any;		// User names indexed by clientID

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.userMap = {};

			this.notifyRemoteChange = this.notifyRemoteChange.bind(this);
			this.notifyUserChange = this.notifyUserChange.bind(this);
			this.notifyLocalChange = this.notifyLocalChange.bind(this);
			cs.onChange('doodle', this.notifyRemoteChange);
			cs.onChange('WellKnownName_users', this.notifyUserChange);
		}

	reset(): void
		{
			this.userMap = {};
			this.reRender();
		}

	notifyRemoteChange(cs: CS.ClientSession, state: any)
		{
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
				let editDoodle: OT.OTArrayResource = new OT.OTArrayResource('doodle');
				//editChat.edits.push([ OT.OpRetain, this.chatArray.length, [ [ ] ] ]);
				//editChat.edits.push([ OT.OpInsert, 1, [ [ cs.clientID, s ] ] ]);
				editRoot.edits.push(editDoodle);
				cs.clientEngine.addLocal(editRoot);
				cs.tick();
				this.reRender();
			}
		}

}
