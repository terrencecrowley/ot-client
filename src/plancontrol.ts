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

	itemEdit: Plan.IPlanItem;

	propsBucketNew: IP.InputProps;
	propsItemNew: IP.InputProps;
	propsItemName: IP.InputProps;
	propsItemList: IP.InputProps;
	propsItemListNew: IP.InputProps;

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

			this.itemEdit = null;

			this.updateBucket = this.updateBucket.bind(this);
			this.doneBucket = this.doneBucket.bind(this);
			this.updateItem = this.updateItem.bind(this);
			this.doneItem = this.doneItem.bind(this);
			this.updateItemName = this.updateItemName.bind(this);

			this.propsBucketNew = { bFocus: true, bActive: false, val: '+ New Bucket', valEdit: '', update: this.updateBucket, done: this.doneBucket };
			this.propsItemNew = { bFocus: true, bActive: false, val: '', valEdit: '', update: this.updateItem, done: this.doneItem };
			this.propsItemName = { bFocus: false, bActive: false, val: '', valEdit: '', update: this.updateItemName, done: null };
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

	editItemProperty(item: Plan.IPlanItem, sProp: string): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.clientEngine)
			{
				let editRoot = css.startLocalEdit();

				let editItem: OT.OTMapResource = new OT.OTMapResource(item.uid);
				editItem.edits.push([ OT.OpMapSet, sProp, item[sProp] ]);
				editRoot.edits.push(editItem);

				css.addLocal(editRoot);
				css.tick();
			}
		}

	doneEdits(ok: boolean): void
		{
			this.itemEdit = null;
			this.doneBucket(ok);
			this.doneItem(ok);
			this.propsItemNew.bActive = false;
			this.propsBucketNew.bActive = false;
			this.reRender();
		}

	startEditItem(uidItem: string): void
		{
			this.doneEdits(true);
			this.itemEdit = this.plan.getItemByUID(uidItem);
			this.propsItemName.bActive = true;
			this.propsItemName.val = this.itemEdit.name;
			this.propsItemName.valEdit = this.itemEdit.name;
			this.reRender();
		}

	endEditItem(): void
		{
			this.doneEdits(true);
		}

	editNewBucket(): void
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsBucketNew.bActive = true;
		}

	editNewItem(uidBucket: string): void
		{
			this.actions.fire(ClientActions.DoneEdits, true);
			this.propsItemNew.bActive = true;
			this.propUIDBucket = uidBucket;
		}

	updateBucket(valEdit: string): void
		{
			this.propsBucketNew.valEdit = valEdit;
			this.reRender();
		}

	updateItem(valEdit: string): void
		{
			this.propsItemNew.valEdit = valEdit;
			this.reRender();
		}

	updateItemName(valEdit: string): void
		{
			this.propsItemName.valEdit = valEdit;
			this.itemEdit.name = valEdit;
			this.editItemProperty(this.itemEdit, 'name');
		}

	doneBucket(ok: boolean): void
		{
			if (this.propsBucketNew.bActive && ok && this.propsBucketNew.valEdit != '')
				this.addBucket(this.propsBucketNew.valEdit);
			this.propsBucketNew.bActive = false;
			this.propsBucketNew.valEdit = '';
			this.reRender();
		}

	doneItem(ok: boolean): void
		{
			if (this.propsItemNew.bActive && ok && this.propsItemNew.valEdit != '')
			{
				let item: Plan.IPlanItem = this.plan.createEmptyItem();
				item.bucket = this.propUIDBucket;
				item.name = this.propsItemNew.valEdit;
				this.editItem(item);
			}
			this.propsItemNew.bActive = false;
			this.propsItemNew.valEdit = '';
			this.reRender();
		}
}
