import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as ClientActions from "./clientactions";

export class QueryControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	props: any; // query, yes, no, callback

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.props = {};
		}

	query(props?: any): void
		{
			this.props = props === undefined ? {} : props;
			this.reRender();
		}

	fire(result: boolean): void
		{
			if (this.props.callback)
				this.props.callback(result);
			this.props = {};
			this.reRender();
		}
}
