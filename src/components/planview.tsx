import * as React from "react";
import * as Plan from "../plan";
import * as PlanControl from "../plancontrol";
import * as IP from "./inputview";

export interface PlanProps {
	planControl: PlanControl.PlanControl
}

export interface PlanState {
	itemEdit: Plan.IPlanItem
}

export class PlanView extends React.Component<PlanProps, PlanState> {
	
	constructor(props: any)
		{
			super(props);
			this.handleNewBucket = this.handleNewBucket.bind(this);
			this.handleNewItem = this.handleNewItem.bind(this);
			this.handleItemClick = this.handleItemClick.bind(this);
			this.handleItemCancel = this.handleItemCancel.bind(this);

			this.state = { itemEdit: null };
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
			this.props.planControl.doneEdits(true);
			let item: Plan.IPlanItem = this.props.planControl.plan.getItemByUID(e.currentTarget.id);

			this.setState( { itemEdit: item } );
   
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleItemCancel(e: any): boolean
		{
			this.setState( { itemEdit: null } );
   
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
			let state: PlanState = this.state;
			let mItems: any = plan.getItemsByBucket();
			let cols: any[] = [];
			let p: IP.InputProps = this.props.planControl.propsItem;
			let uidActive: string = this.props.planControl.propUIDBucket;
			for (let uidBucket in mItems) if (mItems.hasOwnProperty(uidBucket))
			{
				let aItems = mItems[uidBucket] as Plan.IPlanItem[];
				let bucketName: string = plan.getBucketName(uidBucket);
				let col: any[] = [];
				col.push(
					<div className="buckethead">{bucketName}</div>
					);
				col.push(
					<div className="hr"></div>
					);
				col.push(
					<div className="newitem" onClick={this.handleNewItem} id={uidBucket}>+</div>
					);

				if (p.bActive && uidBucket == uidActive)
				{
					col.push(
						<div className="item">
							<IP.InputView bActive={p.bActive} val={p.val} valEdit={p.valEdit} update={p.update} done={p.done} />
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
			p = this.props.planControl.propsBucket;
			cols.push(
				<div className="column items">
					<div className="newbucket" onClick={this.handleNewBucket}>
					<IP.InputView bActive={p.bActive} val={p.val} valEdit={p.valEdit} update={p.update} done={p.done} />
					</div>
				</div>
				);

			let popup: any = null;
			if (state.itemEdit)
			{
				popup = (
					<div className="popupprops">
						<div className="right" onClick={this.handleItemCancel} >
							<button id='cancel'><img src='/ShowNo.png' /></button>
						</div>
						<div>{state.itemEdit.name}</div>
						<div>{plan.getBucketName(state.itemEdit.bucket)}</div>
					</div>
					);
			}
			
			return (
				<div className="row">
				{cols}
				{popup}
				</div>
				);
		}
}
