import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as ClientActions from "./clientactions";

export class SessionControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	actions: ClientActions.IClientActions;
	reRender: () => void;
	user: any;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;
			this.handleStatus = this.handleStatus.bind(this);
			cs.on('status', this.handleStatus);
			this.user = cs.user;
		}

	doneEdits(ok: boolean): void
		{
		}

	handleStatus(cs: CS.ClientSession)
		{
			this.user = cs.user;
			this.reRender();
		}
}
