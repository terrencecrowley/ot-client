import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
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
	propsStartDate: IP.InputProps;
	propsDueDate: IP.InputProps;
	propsDescription: IP.InputProps;
	propsComment: IP.InputProps;
	propsCheckList: IP.InputProps;

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
			this.updateStartDate = this.updateStartDate.bind(this);
			this.updateDueDate = this.updateDueDate.bind(this);
			this.updateDescription = this.updateDescription.bind(this);
			this.updateComment = this.updateComment.bind(this);
			this.updateCheckList = this.updateCheckList.bind(this);
			this.addCheckList = this.addCheckList.bind(this);
			this.deleteBucket = this.deleteBucket.bind(this);

			this.propsBucketNew = { bImg: true, bFocus: true, bActive: false, bFaded: false, val: '+ New Bucket', valEdit: '', update: this.updateBucket, done: this.doneBucket };
			this.propsItemNew = { bImg: true, bFocus: true, bActive: false, bFaded: false, val: '', valEdit: '', update: this.updateItem, done: this.doneItem };
			this.propsItemName = { bImg: false, bFocus: false, bActive: false, bFaded: false, val: '', valEdit: '', update: this.updateItemName, done: null };
			this.propsStartDate = { bImg: false, bFocus: false, bActive: true, bFaded: false, val: 'Start anytime', valEdit: '', update: this.updateStartDate, done: null };
			this.propsDueDate = { bImg: false, bFocus: false, bActive: true, bFaded: false, val: 'Due anytime', valEdit: '', update: this.updateDueDate, done: null };
			this.propsDescription = { bImg: false, bFocus: false, bActive: false, bFaded: false, val: '', valEdit: '', update: this.updateDescription, done: null };
			this.propsComment = { bImg: false, bFocus: false, bActive: false, bFaded: false, val: '', valEdit: '', update: this.updateComment, done: null };
			this.propsCheckList = { bImg: false, bFocus: true, bActive: false, bFaded: true, val: 'add an item', valEdit: '', update: this.updateCheckList, done: this.addCheckList };
			this.propUIDBucket = '';
		}

	reset(): void
		{
			this.plan = new Plan.Plan();
			this.itemEdit = null;
			this.reRender();
		}

	notifyPlanChange(cs: CS.ClientSession, planData: any): void
		{
			if (planData === undefined)
				this.reset();
			else
			{
				this.plan.value = planData;
				if (this.itemEdit)
					this.itemEdit = this.plan.getItemByUID(this.itemEdit.uid);
				this.reRender();
			}
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

	deleteBucket(uid: string): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (css.clientEngine)
			{
				let editRoot = css.startLocalEdit();

				// Delete the bucket
				let editBuckets: OT.OTMapResource = new OT.OTMapResource(Plan.BucketsName);
				editBuckets.edits.push([ OT.OpMapDel, uid, '' ]);
				editRoot.edits.push(editBuckets);

				// Delete the items bound to the bucket
				let editItems: OT.OTMapResource = new OT.OTMapResource(Plan.ItemsName);
				let aItems: Plan.IPlanItem[] = this.plan.getItemsOfBucket(uid);
				for (let i: number = 0; i < aItems.length; i++)
					editItems.edits.push([ OT.OpMapDel, aItems[i].uid, '' ]);
				editRoot.edits.push(editItems);

				// TODO: How to delete the higher level OT resources associated with the items?

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
				this.reRender();
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
			if (this.itemEdit)
			{
				this.propsItemName.bActive = true;
				this.propsItemName.val = this.itemEdit.name;
				this.propsItemName.valEdit = this.itemEdit.name;
				this.propsComment.valEdit = '';
				this.propsDescription.valEdit = this.itemEdit.description;
				this.propsStartDate.valEdit = this.itemEdit.startdate;
				this.propsDueDate.valEdit = this.itemEdit.duedate;
				this.propsCheckList.valEdit = '';
			}
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

	updateStartDate(valEdit: string): void
		{
			this.propsStartDate.valEdit = valEdit;
			this.itemEdit.startdate = valEdit;
			this.editItemProperty(this.itemEdit, 'startdate');
		}

	updateDueDate(valEdit: string): void
		{
			this.propsDueDate.valEdit = valEdit;
			this.itemEdit.duedate = valEdit;
			this.editItemProperty(this.itemEdit, 'duedate');
		}

	updateDescription(valEdit: string): void
		{
			this.propsDescription.valEdit = valEdit;
			this.itemEdit.description = valEdit;
			this.editItemProperty(this.itemEdit, 'description');
		}

	updateItemBucket(value: string): void
		{
			this.itemEdit.bucket = value;
			this.editItemProperty(this.itemEdit, 'bucket');
		}

	updateItemProgress(value: string): void
		{
			this.itemEdit.progress = Number(value);
			this.editItemProperty(this.itemEdit, 'progress');
		}

	updateComment(valEdit: string): void
		{
			this.propsComment.valEdit = valEdit;
			this.reRender();
			// Only takes effect on Post
		}

	postComment(): void
		{
			let cs: CS.ClientSession = this.clientSession;
			let css: CS.ClientSessionState = cs.session;
			if (this.itemEdit && css.clientEngine && this.propsComment.valEdit != '')
			{
				let editRoot = css.startLocalEdit();
				let comments: Plan.ICommentArray = this.plan.value[this.itemEdit.comments] as Plan.ICommentArray;

				let editItem: OT.OTArrayResource = new OT.OTArrayResource(this.itemEdit.comments);
				if (comments && comments.length > 0)
					editItem.edits.push( [ OT.OpRetain, comments.length, [] ] );
				let me: string = cs.userID;
				let d = Date();
				editItem.edits.push([ OT.OpInsert, 1, [ [ me, this.propsComment.valEdit, d.toString() ] ] ]);
				this.propsComment.valEdit = '';
				editRoot.edits.push(editItem);

				css.addLocal(editRoot);
				css.tick();
				this.reRender();
			}
		}

	updateCheckList(valEdit: string): void
		{
			this.propsCheckList.valEdit = valEdit;
			this.reRender();
			// Only takes effect on addCheckList
		}

	addCheckList(ok: boolean): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (! ok)
			{
				this.propsCheckList.valEdit = '';
				this.propsCheckList.bActive = false;
				this.reRender();
			}
			else if (this.itemEdit && css.clientEngine && this.propsCheckList.valEdit != '')
			{
				let editRoot = css.startLocalEdit();
				let checkList: Plan.ICheckListArray = this.plan.value[this.itemEdit.checklist] as Plan.ICheckListArray;

				let editItem: OT.OTArrayResource = new OT.OTArrayResource(this.itemEdit.checklist);
				if (checkList && checkList.length > 0)
					editItem.edits.push( [ OT.OpRetain, checkList.length, [] ] );
				editItem.edits.push([ OT.OpInsert, 1, [ [ this.propsCheckList.valEdit, false ] ] ]);
				this.propsCheckList.valEdit = '';
				editRoot.edits.push(editItem);

				css.addLocal(editRoot);
				css.tick();
				this.reRender();
			}
		}

	toggleCheckList(i: number): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (this.itemEdit && css.clientEngine)
			{
				let editRoot = css.startLocalEdit();
				let checkList: Plan.ICheckListArray = this.plan.value[this.itemEdit.checklist] as Plan.ICheckListArray;
				let checkListItem: Plan.ICheckListItem = checkList[i];

				let editItem: OT.OTArrayResource = new OT.OTArrayResource(this.itemEdit.checklist);
				if (i != 0)
					editItem.edits.push( [ OT.OpRetain, i, [] ] );
				editItem.edits.push([ OT.OpSet, 1, [ [ checkListItem[0], ! checkListItem[1] ] ] ]);
				if (i != checkList.length - 1)
					editItem.edits.push( [ OT.OpRetain, checkList.length - i - 1, [] ] );
				editRoot.edits.push(editItem);

				css.addLocal(editRoot);
				css.tick();
				this.reRender();
			}
		}

	deleteCheckList(i: number): void
		{
			let css: CS.ClientSessionState = this.clientSession.session;
			if (this.itemEdit && css.clientEngine)
			{
				let editRoot = css.startLocalEdit();
				let checkList: Plan.ICheckListArray = this.plan.value[this.itemEdit.checklist] as Plan.ICheckListArray;

				let editItem: OT.OTArrayResource = new OT.OTArrayResource(this.itemEdit.checklist);
				if (i != 0)
					editItem.edits.push( [ OT.OpRetain, i, [] ] );
				editItem.edits.push([ OT.OpDelete, 1, [] ]);
				if (i != checkList.length - 1)
					editItem.edits.push( [ OT.OpRetain, checkList.length - i - 1, [] ] );
				editRoot.edits.push(editItem);

				css.addLocal(editRoot);
				css.tick();
				this.reRender();
			}
		}

	toggleShowCheckList(): void
		{
			if (this.itemEdit)
			{
				this.itemEdit.bShowCheck = ! this.itemEdit.bShowCheck;
				this.editItemProperty(this.itemEdit, 'bShowCheck');
			}
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
				item.created_id = this.clientSession.userID;
				this.editItem(item);
			}
			this.propsItemNew.bActive = false;
			this.propsItemNew.valEdit = '';
			this.reRender();
		}
}
