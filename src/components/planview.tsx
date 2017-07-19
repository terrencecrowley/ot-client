import * as React from "react";
import * as Plan from "../plan";
import * as PlanControl from "../plancontrol";
import * as IP from "./inputview";
import * as Menu from "../menu";
import * as ClientActions from "../clientactions";

export interface PlanProps {
	planControl: PlanControl.PlanControl
}

export interface PlanState {
}

let ProgressStrings: string[] = [ 'Not Started', 'In Progress', 'Completed' ];

export class PlanView extends React.Component<PlanProps, PlanState> {
	
	constructor(props: any)
		{
			super(props);
			this.handleNewBucket = this.handleNewBucket.bind(this);
			this.handleNewItem = this.handleNewItem.bind(this);
			this.handleItemClick = this.handleItemClick.bind(this);
			this.handleItemCancel = this.handleItemCancel.bind(this);
			this.handleChangeBucket = this.handleChangeBucket.bind(this);
			this.handleChangeProgress = this.handleChangeProgress.bind(this);
			this.handleChangeDescription = this.handleChangeDescription.bind(this);
			this.handleChangeComment = this.handleChangeComment.bind(this);
			this.handlePostComment = this.handlePostComment.bind(this);
			this.handleCheckList = this.handleCheckList.bind(this);
			this.handleShowCheck = this.handleShowCheck.bind(this);
			this.handleStartCheckItem = this.handleStartCheckItem.bind(this);
			this.handleBucketMenu = this.handleBucketMenu.bind(this);
		}

	handleNewBucket(e: any): boolean
		{
			this.props.planControl.editNewBucket();
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleNewItem(e: any): boolean
		{
			this.props.planControl.editNewItem(e.currentTarget.id);
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleItemClick(e: any): boolean
		{
			this.props.planControl.startEditItem(e.currentTarget.id);
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleItemCancel(e: any): boolean
		{
			this.props.planControl.endEditItem();
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChangeBucket(e: any): boolean
		{
			this.props.planControl.updateItemBucket(e.currentTarget.value);
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChangeProgress(e: any): boolean
		{
			this.props.planControl.updateItemProgress(e.currentTarget.value);
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChangeDescription(e: any): boolean
		{
			this.props.planControl.updateDescription(e.currentTarget.value);
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChangeComment(e: any): boolean
		{
			this.props.planControl.updateComment(e.currentTarget.value);
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handlePostComment(e: any): boolean
		{
			this.props.planControl.postComment();
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleCheckList(e: any): boolean
		{
			this.props.planControl.toggleCheckList(Number(e.currentTarget.id));
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleShowCheck(e: any): boolean
		{
			this.props.planControl.toggleShowCheckList();
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleStartCheckItem(e: any): boolean
		{
			this.props.planControl.propsCheckList.bActive = true;
			this.props.planControl.reRender();
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleBucketMenu(e: any): boolean
		{
			let menuprops: Menu.IMenu = Menu.createEmpty();
			menuprops.absx = e.clientX;
			menuprops.absy = e.clientY;
			let planControl = this.props.planControl;
			menuprops.callback = (result: string) => { if (result != '') planControl.deleteBucket(result); }
			menuprops.choices = [ [ '', 'Rename' ], [ e.target.id, 'Delete' ] ];

			this.props.planControl.actions.fire(ClientActions.Menu, menuprops);

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	componentDidUpdate(oldProps: PlanProps, oldState: PlanState): void
		{
		}

	render()
		{
			let plan: Plan.Plan = this.props.planControl.plan;
			let mItems: any = plan.getItemsByBucket();
			let cols: any[] = [];
			let uidActive: string = this.props.planControl.propUIDBucket;
			for (let uidBucket in mItems) if (mItems.hasOwnProperty(uidBucket))
			{
				let aItems = mItems[uidBucket] as Plan.IPlanItem[];
				let bucketName: string = plan.getBucketName(uidBucket);
				let col: any[] = [];
				col.push(
					<div className="buckethead">
						<div className="row spread">
							<span>&nbsp;</span>
							<span>{bucketName}</span>
							<span className='menutarget' id={uidBucket} onClick={this.handleBucketMenu}>...</span>
						</div>
					</div>
					);
				col.push(
					<div className="hr"></div>
					);
				col.push(
					<div className="newitem" onClick={this.handleNewItem} id={uidBucket}>+</div>
					);

				if (this.props.planControl.propsItemNew.bActive && uidBucket == uidActive)
				{
					let p: IP.InputProps = this.props.planControl.propsItemNew;
					col.push(
						<div className="item">
							<IP.InputView bImg={p.bImg} bActive={p.bActive} bFocus={p.bFocus} bFaded={p.bFaded} val={p.val} valEdit={p.valEdit} update={p.update} done={p.done} />
						</div>
						);
				}
				for (let i: number = 0; i < aItems.length; i++)
				{
					let item: Plan.IPlanItem = aItems[i];
					col.push(
						<div className="item" id={item.uid} onClick={this.handleItemClick} >
						{item.name}
						</div>
						);
				}

				cols.push(
					<div className="column items">
					{col}
					</div>
					);
			}

			let p = this.props.planControl.propsBucketNew;
			cols.push(
				<div className="column items">
					<div className="newbucket" onClick={this.handleNewBucket}>
					<IP.InputView bImg={p.bImg} bFocus={p.bFocus} bActive={p.bActive} bFaded={p.bFaded} val={p.val} valEdit={p.valEdit} update={p.update} done={p.done} />
					</div>
				</div>
				);

			let popup: any = null;
			if (this.props.planControl.itemEdit)
			{
				let item: Plan.IPlanItem = this.props.planControl.itemEdit;
				let buckets: any = plan.getBuckets();
				let comments = plan.getComments(item);
				let checklist = plan.getCheckList(item);
				let optionsBucket: any[] = [];
				for (let bid in buckets) if (buckets.hasOwnProperty(bid))
					optionsBucket.push(<option value={bid}>{buckets[bid]}</option>);
				let optionsProgress: any[] = [];
				for (let i: number = 0; i < 3; i++)
					optionsProgress.push(<option value={i}>{ProgressStrings[i]}</option>);
				let commentsBlockArray: any[] = [];
				if (comments.length > 0)
				{
					for (let j: number = 0; j < comments.length; j++)
					{
						let iComment: Plan.IComment = comments[j];
						commentsBlockArray.push(
							<span>
								{iComment[1]}
								&nbsp;
								by
								&nbsp;
								{iComment[0]}
							</span>
							);
					}
				}
				let checklistBlockArray: any[] = [];
				let nChecked: number = 0;
				if (checklist.length > 0)
				{
					for (let j: number = 0; j < checklist.length; j++)
					{
						let iCheck: Plan.ICheckListItem = checklist[j];
						let cn: string = '';
						if (iCheck[1]) { nChecked++; cn = 'deleted'; }
						checklistBlockArray.push(
							<div>
								<input type='checkbox' id={String(j)} checked={iCheck[1]} onClick={this.handleCheckList} />
								&nbsp;
								<span className={cn}>{iCheck[0]}</span>
							</div>
							);
					}
				}
				let pName = this.props.planControl.propsItemName;
				let pDue = this.props.planControl.propsDueDate;
				let pStart = this.props.planControl.propsStartDate
				let pComment = this.props.planControl.propsComment;
				let pCheck = this.props.planControl.propsCheckList;
				popup = (
					<div className="popupprops">
						<div className="right" onClick={this.handleItemCancel} >
							<button id='cancel'><img src='/ShowNo.png' /></button>
						</div>
						<div className='row distinctblock'>
							<div className='column'>
								<IP.InputView bImg={pName.bImg} bFocus={pName.bFocus} bActive={pName.bActive} bFaded={pName.bFaded} val={pName.val} valEdit={pName.valEdit} update={pName.update} done={pName.done} />
							</div>
						</div>
						<div className='row distinctblock'>
							<div className='column'>
								<div className='row'>
									Bucket
								</div>
								<div className='row'>
									<select id='bucket' value={item.bucket} onChange={this.handleChangeBucket}>
										{optionsBucket}
									</select>
								</div>
							</div>
							<div className='column'>
								<div className='row'>
									Progress
								</div>
								<div className='row'>
									<select id='progress' value={item.progress} onChange={this.handleChangeProgress}>
										{optionsProgress}
									</select>
								</div>
							</div>
							<div className='column'>
								<div className='row'>
									Start date
								</div>
								<div className='row'>
									<IP.InputView bImg={pStart.bImg} bFocus={pStart.bFocus} bActive={pStart.bActive} bFaded={pStart.bFaded} val={pStart.val} valEdit={pStart.valEdit} update={pStart.update} done={pStart.done} />
								</div>
							</div>
							<div className='column'>
								<div className='row'>
									Due date
								</div>
								<div className='row'>
									<IP.InputView bImg={pDue.bImg} bFocus={pDue.bFocus} bActive={pDue.bActive} bFaded={pDue.bFaded} val={pDue.val} valEdit={pDue.valEdit} update={pDue.update} done={pDue.done} />
								</div>
							</div>
						</div>
						<div className='column distinctblock'>
							<div className='row spread'>
								<div>
									Checklist
									&nbsp;
									{nChecked}
									&nbsp;
									of
									&nbsp;
									{checklist.length}
								</div>
								<div>
									show on card
									<input type='checkbox' checked={item.bShowCheck} onClick={this.handleShowCheck} />
								</div>
							</div>
							{checklistBlockArray}
							<div className='row' onClick={this.handleStartCheckItem} >
								<div>
									<input type='checkbox' checked={false} disabled={true} />
									&nbsp;
								</div>
								<IP.InputView bImg={pCheck.bImg} bFocus={pCheck.bFocus} bActive={pCheck.bActive} bFaded={pCheck.bFaded} val={pCheck.val} valEdit={pCheck.valEdit} update={pCheck.update} done={pCheck.done} />
							</div>
						</div>
						<div className='row distinctblock'>
							<div className='column'>
								<br/>
								Description
								<br/>
								<div><textarea onChange={this.handleChangeDescription} value={item.description} /></div>
							</div>
						</div>
						<div className='row distinctblock'>
							<div className='column'>
								<div className='row'>
									<div className='column'>
										<br/>
										Comments
										<br/>
										<div><textarea onChange={this.handleChangeComment} value={pComment.valEdit} /></div>
										<br/>
									</div>
								</div>
								<div className='right'>
									<button onClick={this.handlePostComment} >Post</button>
									<br/>
								</div>
								<div className='row'>
									<div className='column'>
										<span>&nbsp;</span>
										{commentsBlockArray}
									</div>
								</div>
							</div>
						</div>
						<div className='row'>
							<br/>
							Created by&nbsp;
							{item.created_id}
							&nbsp;at&nbsp;
							{item.created_date}
						</div>
					</div>
					);
			}
			
			return (
				<div className='row'>
				{cols}
				{popup}
				</div>
				);
		}
}
