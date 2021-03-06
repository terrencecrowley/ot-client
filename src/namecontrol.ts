import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as ClientActions from "./clientactions";
import * as IP from "./components/inputview";

export class NameControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	name: string;

	propsName: IP.InputProps;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.name = '';
			this.handleState = this.handleState.bind(this);
			cs.on('state', this.handleState);
			this.notifyLocalChange = this.notifyLocalChange.bind(this);
			this.updateName = this.updateName.bind(this);
			this.doneName = this.doneName.bind(this);

			let s: string = (this.name == '') ? 'Name' : this.name;
			this.propsName = { bImg: true, bFocus: true, bActive: false, bFaded: false, val: s, valEdit: '', update: this.updateName, done: this.doneName };
		}

	reset(): void
		{
			this.name = '';
			this.reRender();
		}

	handleState(cs: CS.ClientSession, css: CS.ClientSessionState)
		{
			if (css == null || css.state == null)
				this.reset();
			else
			{
				this.name = css.getName();
				if (this.name === undefined)
					this.name = '';
				this.propsName.val = this.name == '' ? 'Name' : this.name;
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

	editName()
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsName.bActive = true;
			this.propsName.valEdit = this.name;
			this.reRender();
		}

	doneEdits(ok: boolean): void
		{
			this.doneName(ok);
		}

	doneName(ok: boolean)
		{
			if (this.propsName.bActive && ok && this.propsName.valEdit != '')
				this.notifyLocalChange(this.propsName.valEdit);
			this.propsName.bActive = false;
			this.reRender();
		}

	updateName(valEdit: string)
		{
			this.propsName.valEdit = valEdit;
			this.reRender();
		}
}
