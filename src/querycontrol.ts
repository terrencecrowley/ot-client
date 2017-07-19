import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as ClientActions from "./clientactions";
import * as Query from "./query";

export class QueryControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	props: Query.IQuery;; // query, yes, no, callback

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.props = Query.NullQuery;
		}

	query(props: Query.IQuery): void
		{
			this.props = props;
			this.reRender();
		}

	doneEdits(ok: boolean): void
		{
			this.props = Query.NullQuery;
			this.reRender();
		}

	fire(result: boolean): void
		{
			if (this.props.callback)
				this.props.callback(result);
			this.props = Query.NullQuery;
			this.reRender();
		}
}
