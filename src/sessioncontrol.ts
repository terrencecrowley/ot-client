import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";

export class SessionControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;

	user: any;		// user object with name, sessions
	reRender: () => void;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.user = cs.user
			this.notifyChange = this.notifyChange.bind(this);
			cs.onStatusChange(this.notifyChange);
		}

	notifyChange(cs: CS.ClientSession)
		{
			this.user = cs.user;
			this.reRender();
		}
}
