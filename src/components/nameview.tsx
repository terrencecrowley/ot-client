import * as React from "react";
import * as Name from "../agree";
import * as NameControl from "../namecontrol";

export interface NameProps {
	nc: NameControl.NameControl
}

export interface NameState {
	bEditingName: boolean,
	sName: string
}

export class NameView extends React.Component<NameProps, NameState> {

	textInput: any;

	constructor(props: any)
		{
			super(props);
			this.textInput = null;
			this.handleClick = this.handleClick.bind(this);
			this.handleTextChange = this.handleTextChange.bind(this);
			this.handleTextReturn = this.handleTextReturn.bind(this);
			this.state = { bEditingName: false, sName: '' };
		}

	handleTextChange(event: any): void
		{
			if (this.state.bEditingName)
				this.setState( { bEditingName: true, sName: event.target.value } );
		}

	handleTextReturn(event?: any): void
		{
			if (event === undefined || event.charCode == 13)
			{
				if (this.state.bEditingName)
				{
					let val: string = (event === undefined) ? this.state.sName : event.target.value;
					this.props.nc.notifyLocalChange(val);
					this.setState( { bEditingName: false, sName: '' } );
				}
			}
		}

	handleClick(e: any): boolean
		{
			if (this.state.bEditingName)
			{
				if (e.currentTarget.id == "ok")
					this.handleTextReturn();
				else if (e.currentTarget.id == "cancel")
					this.setState( { bEditingName: false, sName: '' } );
			}
			else
				this.setState( { bEditingName: true, sName: this.props.nc.name } );
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	componentDidUpdate(oldProps: NameProps, oldState: NameState): void
		{
			if (this.state.bEditingName && this.textInput)
				this.textInput.focus();
		}

	render()
		{
			if (this.state.bEditingName)
			{
				return (
					<div>
						<hr />
						<input ref={(i)=>{this.textInput=i;}} className='chatinput' id='edit' type='text' value={this.state.sName} onChange={this.handleTextChange} onKeyPress={this.handleTextReturn} />
						<button id='ok' onClick={this.handleClick} ><img src='/ShowYes.png' /></button>&nbsp;
						<button id='cancel' onClick={this.handleClick} ><img src='/ShowNo.png' /></button>
						<hr />
					</div>
					);
			}
			else
			{
				if (this.props.nc.name == '')
					return (<div onClick={this.handleClick} ><hr />Name<hr /></div>);
				else
					return (<div onClick={this.handleClick} ><hr />{this.props.nc.name}<hr /></div>);
			}
		}
}
