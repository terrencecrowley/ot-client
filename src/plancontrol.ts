import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as Plan from "./plan";
import * as Util from "./util";
import * as ClientActions from "./clientactions";
import * as IP from "./components/inputview";

export class PlanControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	plan: Plan.Plan;		// Local plan state

	propsBucket: IP.InputProps;
	propsItem: IP.InputProps;
	propUIDBucket: string;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.plan = new Plan.Plan();
			this.notifyPlanChange = this.notifyPlanChange.bind(this);
			cs.onState(this.notifyPlanChange);

			this.updateBucket = this.updateBucket.bind(this);
			this.doneBucket = this.doneBucket.bind(this);
			this.updateItem = this.updateItem.bind(this);
			this.doneItem = this.doneItem.bind(this);

			this.propsBucket = { bActive: false, val: '+ New Bucket', valEdit: '', update: this.updateBucket, done: this.doneBucket };
			this.propsItem = { bActive: false, val: '', valEdit: '', update: this.updateItem, done: this.doneItem };
			this.propUIDBucket = '';
		}

	reset(): void
		{
			this.plan = new Plan.Plan();
		}

	notifyPlanChange(cs: CS.ClientSession, planData: any): void
		{
			if (planData === undefined)
				this.reset();
			else
				this.plan.value = planData;
		}

	addBucket(bucketName: string): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.clientEngine)
			{
				let editRoot = css.startLocalEdit();
				let editBuckets: OT.OTMapResource = new OT.OTMapResource(Plan.BucketsName);
				let uid: string = Util.createGuid();
				editBuckets.edits.push([ OT.OpMapSet, uid, bucketName ]);
				editRoot.edits.push(editBuckets);
				css.addLocal(editRoot);
				css.tick();
			}
		}

	editItem(item: Plan.IPlanItem): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.clientEngine)
			{
				let editRoot = css.startLocalEdit();

				if (item.uid == '')
				{
					let editItems: OT.OTMapResource = new OT.OTMapResource(Plan.ItemsName);
					item.uid = Util.createGuid();
					editItems.edits.push([ OT.OpMapSet, item.uid, '' ]);
					editRoot.edits.push(editItems);
				}

				let editItem: OT.OTMapResource = new OT.OTMapResource(item.uid);

				// TODO: Ideally only explicitly set properties that have been locally edited to prevent overwriting
				// other simultaneous edits.
				for (let p in item) if (item.hasOwnProperty(p))
					editItem.edits.push([ OT.OpMapSet, p, item[p] ]);

				editRoot.edits.push(editItem);

				css.addLocal(editRoot);
				css.tick();
			}
		}

	doneEdits(ok: boolean): void
		{
			this.doneBucket(ok);
			this.doneItem(ok);
			this.propsItem.bActive = false;
			this.propsBucket.bActive = false;
		}

	editNewBucket(): void
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsBucket.bActive = true;
		}

	editNewItem(uidBucket: string): void
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsItem.bActive = true;
			this.propUIDBucket = uidBucket;
		}

	updateBucket(valEdit: string): void
		{
			this.propsBucket.valEdit = valEdit;
			this.reRender();
		}

	updateItem(valEdit: string): void
		{
			this.propsItem.valEdit = valEdit;
			this.reRender();
		}

	doneBucket(ok: boolean): void
		{
			if (this.propsBucket.bActive && ok && this.propsBucket.valEdit != '')
				this.addBucket(this.propsBucket.valEdit);
			else
				this.propsBucket.bActive = false;
			this.propsBucket.valEdit = '';
			this.reRender();
		}

	doneItem(ok: boolean): void
		{
			if (this.propsItem.bActive && ok && this.propsItem.valEdit != '')
			{
				let item: Plan.IPlanItem = this.plan.createEmptyItem();
				item.bucket = this.propUIDBucket;
				item.name = this.propsItem.valEdit;
				this.editItem(item);
			}
			else
				this.propsItem.bActive = false;
			this.propsItem.valEdit = '';
			this.reRender();
		}
}
