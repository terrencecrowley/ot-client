import * as React from "react";
import * as Agree from "../agree";
import * as AgreeControl from "../agreecontrol";
import * as IP from "./inputview";
import * as ClientActions from "../clientactions";
import * as Util from "../util";

export interface AgreeProps {
	agreeControl: AgreeControl.AgreeControl
}

export interface AgreeState {
}

export class AgreeView extends React.Component<AgreeProps, AgreeState> {

	constructor(props: any)
		{
			super(props);
			this.handleChoiceClick = this.handleChoiceClick.bind(this);
			this.handleUserClick = this.handleUserClick.bind(this);
			this.handleSelectClick = this.handleSelectClick.bind(this);
		}

	handleChoiceClick(e: any): boolean
		{
			let agreeControl: AgreeControl.AgreeControl = this.props.agreeControl;

			agreeControl.doneEdits(true);
			if (e.currentTarget.id == '')
				agreeControl.editChoice();
			else
			{
				let choice: Agree.SyncChoice = [ e.currentTarget.id, '', '', '' ];
				let props: any = { query: 'Delete choice?',
								   callback: (b: boolean) => { if (b) this.props.agreeControl.notifyLocal_setChoice(choice); } };
				agreeControl.actions.fire(ClientActions.Query, props);
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleUserClick(e: any): boolean
		{
			let agreeControl: AgreeControl.AgreeControl = this.props.agreeControl;

			agreeControl.doneEdits(true);
			if (e.currentTarget.id == '')
				agreeControl.editUser();
			else
			{
				let sid: string = e.currentTarget.id;
				let props: any = { query: 'Delete user?',
								   callback: (b: boolean) => { if (b) this.props.agreeControl.notifyLocal_setUser(sid); } };
				agreeControl.actions.fire(ClientActions.Query, props);
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleSelectClick(e: any): boolean
		{
			let agreeControl: AgreeControl.AgreeControl = this.props.agreeControl;
			let agree: Agree.Agree = agreeControl.agree;
			agreeControl.doneEdits(true);
			agreeControl.notifyLocal_setSelect(e.currentTarget.id, agree.nextSelection(e.currentTarget.id));
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let agreeControl: AgreeControl.AgreeControl = this.props.agreeControl;
			let agree: Agree.Agree = agreeControl.agree;
			let rows: any[] = [];
			let row: any[] = [];

			// Header Row
			row.push(<div className={'agreeCell agreeCorner agreeRowHeader'}></div>);
			for (let i: number = 0; i < agree.choices.length; i++)
			{
				let c: Agree.SyncChoice = agree.choices[i];
				row.push( <div className={'agreeCell agreeColHeader'} id={c[0]} onClick={this.handleChoiceClick}>{c[2]}</div>);
			}
			let p: IP.InputProps = agreeControl.propsChoice;
			row.push(
				<div className={'agreeCell agreeColHeader'} id='' onClick={this.handleChoiceClick}>
				<IP.InputView bImg={p.bImg} bFocus={p.bFocus} bActive={p.bActive} bFaded={p.bFaded} valEdit={p.valEdit} val={p.val} done={p.done} update={p.update} />
				</div>);
			rows.push(<div className='tablerow'>{row}</div>);

			// Row for each user
			let users: any[] = agree.getUserList();
			for (let j: number = 0; j < users.length; j++)
			{
				let u: any = users[j];
				row = [];
				row.push(<div className={'agreeCell agreeRowHeader'} id={u.id} onClick={this.handleUserClick}>{u.name}</div>);
				for (let k: number = 0; k < agree.choices.length; k++)
				{
					let c: Agree.SyncChoice = agree.choices[k];
					let id: string = u.id + '/' + c[0];
					let val: number = agree.selects[id] === undefined ? -1 : agree.selects[id];
					let classString: string = 'agreeCell agreeMain';
					switch (val)
					{
						case -1: classString += ' ShowOpen'; break;
						case 0: classString += ' ShowNo'; break;
						case 1: classString += ' ShowYes'; break;
						case 2: classString += ' ShowMaybe'; break;
						case 3: classString += ' ShowPicked'; break;
					}
					row.push(<div className={classString} id={id} onClick={this.handleSelectClick}>&nbsp;</div>);
				}
				row.push(<div className={'agreeCell agreeEmpty'} id=''></div>);
				rows.push(<div className='tablerow'>{row}</div>);
			}

			// Row for new user
			p = agreeControl.propsUser;
			row = [];
			row.push(
				<div className={'agreeCell agreeRowHeader'} id='' onClick={this.handleUserClick}>
				<IP.InputView bImg={p.bImg} bFocus={p.bFocus} bActive={p.bActive} bFaded={p.bFaded} valEdit={p.valEdit} val={p.val} done={p.done} update={p.update} />
				</div>);
			for (let k: number = 0; k <= agree.choices.length; k++) row.push(<div className={'agreeCell agreeEmpty'}></div>);
			rows.push(<div className='tablerow'>{row}</div>);

			// Full grid
			return (
				<div className='agreecontainer'>
				<div className='table'>{rows}</div>
				</div>
				);
		}
}
