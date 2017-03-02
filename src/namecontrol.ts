import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as ClientActions from "./clientactions";

export class NameControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	name: string;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.name = '';
			this.notifyData = this.notifyData.bind(this);
			cs.onData(CS.MetaResource, this.notifyData);
			this.notifyLocalChange = this.notifyLocalChange.bind(this);
		}

	reset(): void
		{
			this.name = '';
			this.reRender();
		}

	notifyData(cs: CS.ClientSession, meta: any)
		{
			if (meta === undefined)
				this.reset();
			else
			{
				this.name = cs.session.getName();
				if (this.name === undefined)
					this.name = '';
			}
			this.reRender();
		}

	notifyLocalChange(s: string): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.bInSession)
			{
				css.setName(s);
				this.reRender();
			}
		}

}
