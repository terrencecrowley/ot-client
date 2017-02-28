import * as React from "react";
import * as Agree from "../agree";
import * as AgreeControl from "../agreecontrol";
import * as Util from "../util";

export interface AgreeProps {
	dc: AgreeControl.AgreeControl
}

export interface AgreeState {
	bEditingChoice: boolean,
	sChoice: string,
	bEditingName: boolean,
	sName: string
}

export class AgreeView extends React.Component<AgreeProps, AgreeState> {

	textInput: any;

	constructor(props: any)
		{
			super(props);
			this.textInput = null;
			this.handleClick = this.handleClick.bind(this);
			this.handleChoiceClick = this.handleChoiceClick.bind(this);
			this.handleUserClick = this.handleUserClick.bind(this);
			this.handleSelectClick = this.handleSelectClick.bind(this);
			this.handleTextChange = this.handleTextChange.bind(this);
			this.handleTextReturn = this.handleTextReturn.bind(this);
			this.state = { bEditingChoice: false, sChoice: '', bEditingName: false, sName: '' };
		}

	handleTextChange(event: any): void
		{
			if (this.state.bEditingChoice)
			{
				this.setState( { bEditingChoice: true, sChoice: event.target.value, bEditingName: false, sName: '' } );
			}
			else if (this.state.bEditingName)
			{
				this.setState( { bEditingChoice: false, sChoice: '', bEditingName: true, sName: event.target.value } );
			}
		}

	handleTextReturn(event?: any): void
		{
			if (event !== undefined && event.charCode != 13)
				return;

			let val: string = (event === undefined) ? (this.state.bEditingChoice
														? this.state.sChoice
														: this.state.bEditingName ? this.state.sName : '')
													: event.target.value;
			if (this.state.bEditingChoice)
			{
				if (val != '')
					this.props.dc.notifyLocal_setChoice([ Util.createGuid(), 'enum', val, '' ]);
				this.setState( { bEditingChoice: false, sChoice: '', bEditingName: false, sName: '' } );
			}
			else if (this.state.bEditingName)
			{
				if (val != '')
					this.props.dc.notifyLocal_setUser('anom/' + Util.createGuid(), val);
				this.setState( { bEditingChoice: false, sChoice: '', bEditingName: false, sName: '' } );
			}
		}

	handleClick(e: any): boolean
		{
			this.handleTextReturn();
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChoiceClick(e: any): boolean
		{
			this.handleTextReturn();
			if (e.currentTarget.id == '')
				this.setState( { bEditingChoice: true, sChoice: '', bEditingName: false, sName: '' } );
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleUserClick(e: any): boolean
		{
			this.handleTextReturn();
			if (e.currentTarget.id == '')
				this.setState( { bEditingChoice: false, sChoice: '', bEditingName: true, sName: '' } );
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleSelectClick(e: any): boolean
		{
			let dc: AgreeControl.AgreeControl = this.props.dc;
			let agree: Agree.Agree = dc.agree;
			this.handleTextReturn();
			dc.notifyLocal_setSelect(e.currentTarget.id, agree.nextSelection(e.currentTarget.id));
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	componentDidUpdate(oldProps: AgreeProps, oldState: AgreeState): void
		{
			if (this.state.bEditingName && this.textInput)
				this.textInput.focus();
			else if (this.state.bEditingChoice && this.textInput)
				this.textInput.focus();
		}

	render()
		{
			let agree: Agree.Agree = this.props.dc.agree;
			let state: AgreeState = this.state;
			let rows: any[] = [];
			let row: any[] = [];

			// Header Row
			row.push(<div className={'agreeRowHeader agreeColHeader agreeEmpty'}></div>);
			for (let i: number = 0; i < agree.choices.length; i++)
			{
				let c: Agree.SyncChoice = agree.choices[i];
				row.push( <div className={'agreeColHeader'} id={c[0]} onClick={this.handleChoiceClick}>{c[2]}</div>);
			}
			if (state.bEditingChoice)
				row.push(<input ref={(i)=>{this.textInput=i;}} className="chatinput" id="editingchoice" type="text" value={this.state.sChoice} onChange={this.handleTextChange} onKeyPress={this.handleTextReturn} />);
			else
				row.push( <div className={'agreeColHeader'} id='' onClick={this.handleChoiceClick}>+&nbsp;Choice</div>);
			rows.push(<div className='tablerow'>{row}</div>);

			// Row for each user
			let users: any[] = agree.getUserList();
			for (let j: number = 0; j < users.length; j++)
			{
				let u: any = users[j];
				row = [];
				row.push(<div className={'agreeRowHeader'} id={u.id} onClick={this.handleUserClick}>{u.name}</div>);
				for (let k: number = 0; k < agree.choices.length; k++)
				{
					let c: Agree.SyncChoice = agree.choices[k];
					let id: string = u.id + '/' + c[0];
					let val: number = agree.selects[id] === undefined ? -1 : agree.selects[id];
					let classString: string = 'agreeMain';
					switch (val)
					{
						case 0: classString += ' ShowNo'; break;
						case 1: classString += ' ShowYes'; break;
						case 2: classString += ' ShowMaybe'; break;
						case 3: classString += ' ShowPicked'; break;
					}
					row.push(<div className={classString} id={id} onClick={this.handleSelectClick}>&nbsp;</div>);
				}
				row.push(<div className={'agreeEmpty'} id=''></div>);
				rows.push(<div className='tablerow'>{row}</div>);
			}

			// Row for new user
			row = [];
			if (state.bEditingName)
				row.push(<input ref={(i)=>{this.textInput=i;}} className="chatinput" id="editingname" type="text" value={this.state.sName} onChange={this.handleTextChange} onKeyPress={this.handleTextReturn} />);
			else
				row.push(<div className={'agreeRowHeader'} id='' onClick={this.handleUserClick}>+&nbsp;User</div>);
			for (let k: number = 0; k <= agree.choices.length; k++) row.push(<div className={'agreeEmpty'}></div>);
			rows.push(<div className='tablerow'>{row}</div>);

			// Full grid
			return (<div className='table'>{rows}</div>);
		}
}
