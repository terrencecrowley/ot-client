import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as ClientActions from "./clientactions";
import * as Menu from "./menu";

export class MenuControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	props: Menu.IMenu;; // absx, absy, choices, callback

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.props = Menu.NullMenu
		}

	menu(props: Menu.IMenu): void
		{
			this.props = props;
			this.reRender();
		}

	doneEdits(ok: boolean): void
		{
			this.props = Menu.NullMenu;
			this.reRender();
		}

	fire(result: string): void
		{
			if (this.props.callback)
				this.props.callback(result);
			this.props = Menu.NullMenu;
			this.reRender();
		}
}
