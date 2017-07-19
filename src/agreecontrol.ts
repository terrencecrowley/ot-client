import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as ClientActions from "./clientactions";
import * as Agree from "./agree";
import * as Util from "./util";
import * as IP from "./components/inputview";

export class AgreeControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	userMap: any;		// User names indexed by clientID
	agree: Agree.Agree;

	propsUser: IP.InputProps;
	propsChoice: IP.InputProps;

	// pending local action
	private editRoot: OT.OTCompositeResource;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.editRoot = null;

			this.userMap = {};
			this.agree = new Agree.Agree();

			this.assureLocalUser = this.assureLocalUser.bind(this);
			cs.onJoin('root', this.assureLocalUser);

			this.notifyChangeMeta = this.notifyChangeMeta.bind(this);
			cs.onData(CS.MetaResource, this.notifyChangeMeta);
			this.notifyChangeUsers = this.notifyChangeUsers.bind(this);
			cs.onData('users', this.notifyChangeUsers);
			this.notifyChangeChoices = this.notifyChangeChoices.bind(this);
			cs.onData('choices', this.notifyChangeChoices);
			this.notifyChangeSelects = this.notifyChangeSelects.bind(this);
			cs.onData('selects', this.notifyChangeSelects);
			this.notifyUserChange = this.notifyUserChange.bind(this);
			cs.onData('WellKnownName_users', this.notifyUserChange);

			this.notifyLocal_setName = this.notifyLocal_setName.bind(this);
			this.notifyLocal_setType = this.notifyLocal_setType.bind(this);
			this.notifyLocal_setUser = this.notifyLocal_setUser.bind(this);
			this.notifyLocal_setChoice = this.notifyLocal_setChoice.bind(this);
			this.notifyLocal_setSelect = this.notifyLocal_setSelect.bind(this);

			this.updateUser = this.updateUser.bind(this);
			this.doneUser = this.doneUser.bind(this);
			this.updateChoice = this.updateChoice.bind(this);
			this.doneChoice = this.doneChoice.bind(this);

			this.propsUser = { bImg: true, bFocus: true, bActive: false, bFaded: false, val: '+ User', valEdit: '', update: this.updateUser, done: this.doneUser };
			this.propsChoice = { bImg: true, bFocus: true, bActive: false, bFaded: false, val: '+ Choice', valEdit: '', update: this.updateChoice, done: this.doneChoice };
		}

	reset(): void
		{
			this.userMap = {};
			this.agree = new Agree.Agree();
			this.reRender();
		}

	notifyChangeMeta(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.agree.meta = state;
			this.reRender();
		}

	notifyChangeUsers(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.agree.users = state;
			this.reRender();
		}

	notifyChangeChoices(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.agree.choices = state as Agree.SyncChoice[];
			this.reRender();
		}

	notifyChangeSelects(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.agree.selects = state;
			this.reRender();
		}

	notifyUserChange(cs: CS.ClientSession, userMap: any)
		{
			if (userMap === undefined)
				this.reset();
			else
				this.userMap = userMap;
			this.reRender();
		}

	notifyLocal_start(): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.bInSession)
				this.editRoot = css.startLocalEdit();
		}

	notifyLocal_finish(): void
		{
			this.clientSession.session.addLocal(this.editRoot);
			this.editRoot = null;
			this.reRender();
		}

	notifyLocal_setProp(mapName: string, prop: string, value: any)
		{
			this.notifyLocal_start();
			let editMap: OT.OTMapResource = new OT.OTMapResource(mapName);
			editMap.edits.push([ OT.OpMapSet, prop, value ]);
			this.editRoot.edits.push(editMap);
			this.notifyLocal_finish();
		}

	notifyLocal_deleteProp(mapName: string, prop: string)
		{
			this.notifyLocal_start();
			let editMap: OT.OTMapResource = new OT.OTMapResource(mapName);
			editMap.edits.push([ OT.OpMapDel, prop, '' ]);
			this.editRoot.edits.push(editMap);
			this.notifyLocal_finish();
		}

	notifyLocal_setName(s: string): void
		{
			if (s != this.agree.meta.name)
				this.notifyLocal_setProp(CS.MetaResource, 'name', s);
		}

	notifyLocal_setType(s: string): void
		{
			if (s != this.agree.meta.dtype)
				this.notifyLocal_setProp(CS.MetaResource, 'dtype', s);
		}

	notifyLocal_setUser(sid: string, name?: string): void
		{
			if (name)
			{
				if (this.agree.users[sid] === undefined || this.agree.users[sid] != name)
					this.notifyLocal_setProp('users', sid, name);
			}
			else
			{
				this.notifyLocal_deleteProp('users', sid);
				this.assureLocalUser();
			}
		}

	assureLocalUser(): void
		{
			let cs: CS.ClientSession = this.clientSession;
			if (cs.bInSession && cs.userID != '')
			{
				let meSID: string = cs.userID;
				if (this.agree.users[meSID] === undefined)
					this.notifyLocal_setUser(meSID, cs.user.name);
			}
		}

	notifyLocal_setChoice(choice: Agree.SyncChoice): void
		{
			if (this.clientSession.bInSession)
			{
				this.notifyLocal_start();
				let editChoices: OT.OTArrayResource = new OT.OTArrayResource('choices');
				let i: number = 0;
				for (; i < this.agree.choices.length; i++)
				{
					let c: Agree.SyncChoice = this.agree.choices[i];
					if (c[0] == choice[0])
					{
						if (i)
							editChoices.edits.push([ OT.OpRetain, i, [] ]);
						if (choice[2] != '')
							editChoices.edits.push([ OT.OpSet, 1, [ choice ] ]);
						else
							editChoices.edits.push([ OT.OpDelete, 1, [] ]);
						if (i+1 < this.agree.choices.length)
							editChoices.edits.push([ OT.OpRetain, this.agree.choices.length-(i+1), [] ]);
						break;
					}
				}
				if (i == this.agree.choices.length)
				{
					if (i > 0)
						editChoices.edits.push([ OT.OpRetain, i, [] ]);
					if (choice[2] != '')
						editChoices.edits.push([ OT.OpInsert, 1, [ choice ] ]);
				}
				this.editRoot.edits.push(editChoices);
				this.notifyLocal_finish();
			}
		}

	notifyLocal_setSelect(prop: string, value: any): void
		{
			if (this.agree.selects[prop] === undefined || this.agree.selects[prop] != value)
				this.notifyLocal_setProp('selects', prop, value);
		}

	doneEdits(ok: boolean): void
		{
			this.doneUser(ok);
			this.doneChoice(ok);
			this.propsUser.bActive = false;
			this.propsChoice.bActive = false;
		}

	editUser(): void
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsUser.bActive = true;
		}

	editChoice(): void
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsChoice.bActive = true;
		}

	updateUser(valEdit: string): void
		{
			this.propsUser.valEdit = valEdit;
			this.reRender();
		}

	updateChoice(valEdit: string): void
		{
			this.propsChoice.valEdit = valEdit;
			this.reRender();
		}

	doneUser(ok: boolean): void
		{
			if (this.propsUser.bActive && ok && this.propsUser.valEdit != '')
				this.notifyLocal_setUser('anom/' + Util.createGuid(), this.propsUser.valEdit);
			else
				this.propsUser.bActive = false;
			this.propsUser.valEdit = '';
			this.reRender();
		}

	doneChoice(ok: boolean): void
		{
			if (this.propsChoice.bActive && ok && this.propsChoice.valEdit != '')
				this.notifyLocal_setChoice([ Util.createGuid(), 'enum', this.propsChoice.valEdit, '' ]);
			else
				this.propsChoice.bActive = false;
			this.propsChoice.valEdit = '';
			this.reRender();
		}
}
