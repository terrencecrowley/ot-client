import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as ClientActions from "./clientactions";
import * as Doodle from "./doodle";
import * as Util from "./util";

export class DoodleControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	userMap: any;		// User names indexed by clientID
	doodle: Doodle.Doodle;

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
			this.doodle = new Doodle.Doodle();

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
		}

	reset(): void
		{
			this.userMap = {};
			this.doodle = new Doodle.Doodle();
			this.reRender();
		}

	notifyChangeMeta(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.doodle.meta = state;
			this.reRender();
		}

	notifyChangeUsers(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.doodle.users = state;
			this.reRender();
		}

	notifyChangeChoices(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.doodle.choices = state as Doodle.SyncChoice[];
			this.reRender();
		}

	notifyChangeSelects(cs: CS.ClientSession, state: any)
		{
			if (state === undefined)
				this.reset();
			else
				this.doodle.selects = state;
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

	notifyLocal_setName(s: string): void
		{
			if (s != this.doodle.meta.name)
				this.notifyLocal_setProp(CS.MetaResource, 'name', s);
		}

	notifyLocal_setType(s: string): void
		{
			if (s != this.doodle.meta.dtype)
				this.notifyLocal_setProp(CS.MetaResource, 'dtype', s);
		}

	notifyLocal_setUser(sid: string, name: string): void
		{
			if (this.doodle.users[sid] === undefined || this.doodle.users[sid] != name)
				this.notifyLocal_setProp('users', sid, name);
		}

	assureLocalUser(): void
		{
			let cs: CS.ClientSession = this.clientSession;
			if (cs.bInSession && cs.user.id && cs.user.name)
			{
				let meSID: string = cs.user.ns + '/' + cs.user.id;
				if (this.doodle.users[meSID] === undefined)
					this.notifyLocal_setUser(meSID, cs.user.name);
			}
		}

	notifyLocal_setChoice(choice: Doodle.SyncChoice): void
		{
			if (this.clientSession.bInSession)
			{
				this.notifyLocal_start();
				let editChoices: OT.OTArrayResource = new OT.OTArrayResource('choices');
				let i: number = 0;
				for (; i < this.doodle.choices.length; i++)
				{
					let c: Doodle.SyncChoice = this.doodle.choices[i];
					if (c[0] == choice[0])
					{
						if (i)
							editChoices.edits.push([ OT.OpRetain, i, [] ]);
						editChoices.edits.push([ OT.OpSet, 1, [ choice ] ]);
						if (i+1 < this.doodle.choices.length)
							editChoices.edits.push([ OT.OpRetain, i, [] ]);
						break;
					}
				}
				if (i == this.doodle.choices.length)
				{
					if (i > 0)
						editChoices.edits.push([ OT.OpRetain, i, [] ]);
					editChoices.edits.push([ OT.OpInsert, 1, [ choice ] ]);
				}
				this.editRoot.edits.push(editChoices);
				this.notifyLocal_finish();
			}
		}

	notifyLocal_setSelect(prop: string, value: any): void
		{
			if (this.doodle.selects[prop] === undefined || this.doodle.selects[prop] != value)
				this.notifyLocal_setProp('selects', prop, value);
		}
}
