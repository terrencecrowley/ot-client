// Trello-like planner

/*

Data model as mapped to OT structures:
- Main meta data for overall plan is stored with WellKnownName_meta
- List of buckets is a map named "buckets", keyed by UID, value is bucket name
- List of items is a map named "items", keyed by UID, value unused
- Each item is an independent map, with two secondary maps for checklist and comments.

Plan("WellKnownName_meta", map)
	{ 
		name: string,
		type: "plan",
		label1: string,
		label2: string,
		label3: string,
		label4: string,
		label5: string,
		label6: string
	}

Buckets("buckets", map):
	[ BucketItem_UID, ... ]

(Do I need this? Might if buckets gain additional meta data beyond string name.)
BucketItem(UID, map):
	{ name: string }

Items("items", array):
	[ PlanItem_UID, ... ]

PlanItem(UID, map):
	{
		uid: string,
		name: string,
		description: string,
		assigned_id: string,
		created_id: string
		created_date: string,
		bucket: string, 	// bucketitem_uid
		checklist: string,	// checklistarray_uid
		comments: string,	// commentarray_uid
		showCheck: boolean,
		startdate: string,
		duedate: string,
		progress: number,
		state: number, 		// 0: active, 1: completed, 2: deleted
		label1: boolean,
		label2: boolean,
		label3: boolean,
		label4: boolean,
		label5: boolean,
		label6: boolean
	}

ChecklistArray(UID, array):
	[
		[ value, checked ]
		...
	]

CommentArray(UID, array):
	[
		[ value: string, id: string, date: string ]
		...
	]

*/

import * as Util from "./util";

export const BucketsName: string = 'buckets';
export const ItemsName: string = 'items';
export type ICheckListItem  = [ string, boolean ];
export type ICheckListArray = ICheckListItem[];
export type IComment = [ string, string, string ];
export type ICommentArray = IComment[];

export interface IPlanItem
{
	[key: string]: any;
	uid: string;
	name: string;
	description: string;
	assigned_id: string;
	created_id: string;
	created_date: string;
	bucket: string; 	// bucketitem_uid
	checklist: string;	// checklistarray_uid
	comments: string;	// commentarray_uid
	bShowCheck: boolean;
	startdate: string;
	duedate: string;
	progress: number;
	state: number; 		// 0: active, 1: completed, 2: deleted
	label1: boolean;
	label2: boolean;
	label3: boolean;
	label4: boolean;
	label5: boolean;
	label6: boolean;
}

export interface IPlanMeta
{
	name: string;
	type: string;	// "plan"
	label1: string;
	label2: string;
	label3: string;
	label4: string;
	label5: string;
	label6: string;
}

export class Plan
{
	value: any;		// Composite value shared over OT

	constructor()
		{
			this.value = null;
		}

	createEmptyItem(): IPlanItem
		{
			let i: any = {};
			i.uid = '';
			i.name = '';
			i.description = '';
			i.assigned_id = '';
			i.created_id = '';
			i.bShowCheck = false;
			let d = Date();
			i.created_date = d.toString();
			i.bucket = '';
			i.checklist = Util.createGuid();
			i.comments = Util.createGuid();
			i.startdate = '';
			i.enddate = '';
			i.progress = 0;
			i.state = 0;
			i.label1 = false;
			i.label2 = false;
			i.label3 = false;
			i.label4 = false;
			i.label5 = false;
			i.label6 = false;
			return i as IPlanItem;
		}

	getItemByUID(uid: string): IPlanItem
		{
			if (this.value)
				return this.value[uid];

			return null;
		}

	getItemsByBucket(): any // map of arrays of buckets keyed by bucketID
		{
			let mBuckets: any = {};

			if (this.value)
			{
				// First initialize arrays (ensures all buckets are represented even if item list is empty)
				let mAllBuckets: any = this.value[BucketsName];
				for (let p in mAllBuckets) if (mAllBuckets.hasOwnProperty(p))
					mBuckets[p] = [];

				let mItems: any = this.value[ItemsName];
				for (let p in mItems) if (mItems.hasOwnProperty(p))
				{
					let item: IPlanItem = this.value[p] as IPlanItem;
					if (item)
					{
						let aItems: IPlanItem[] = mBuckets[item.bucket];
						if (! aItems) // shouldn't really happen because of prior initialization step
						{
							aItems = [];
							mBuckets[item.bucket] = aItems;
						}
						aItems.push(item);
					}
				}
			}
			return mBuckets;
		}

	getBucketName(uid: string): string
		{
			if (this.value && this.value[BucketsName])
				return (this.value[BucketsName])[uid];
			return 'ErrorNoBucket';
		}

	getBuckets(): any
		{
			if (this.value[BucketsName])
				return this.value[BucketsName];
			return {};
		}

	getCheckList(item: IPlanItem): ICheckListArray
		{
			if (this.value)
			{
				let a: ICheckListArray = this.value[item.checklist] as ICheckListArray;
				if (a)
					return a;
			}
			return [];
		}

	getComments(item: IPlanItem): ICommentArray
		{
			if (this.value)
			{
				let a: ICommentArray = this.value[item.comments] as ICommentArray;
				if (a)
					return a;
			}
			return [];
		}
}
