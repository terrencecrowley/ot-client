import * as React from "react";

export interface InputProps {
	bActive: boolean,
	val: string,
	valEdit: string,
	update: (val: string) => void,
	done: (ok: boolean) => void
}

export interface InputState {
}

export class InputView extends React.Component<InputProps, InputState> {

	elInput: any;

	constructor(props: any)
		{
			super(props);
			this.elInput = null;
			this.handleOKClick = this.handleOKClick.bind(this);
			this.handleTextChange = this.handleTextChange.bind(this);
			this.handleTextReturn = this.handleTextReturn.bind(this);
		}

	handleTextChange(event: any): void
		{
			if (this.props.bActive)
			{
				this.props.valEdit = event.target.value;
				this.props.update(event.target.value);
			}
		}

	handleTextReturn(event?: any): void
		{
			if (event === undefined || event.charCode == 13)
			{
				if (this.props.bActive)
				{
					let val: string = (event === undefined) ? this.props.valEdit : event.target.value;
					this.props.done(true);
				}
			}
		}

	handleOKClick(e: any): boolean
		{
			if (e.currentTarget.id == "ok")
				this.handleTextReturn();
			else if (e.currentTarget.id == "cancel")
				this.props.done(false);

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	componentDidUpdate(oldProps: InputProps, oldState: InputState): void
		{
			if (this.props.bActive && this.elInput)
				this.elInput.focus();
		}

	render()
		{
			if (this.props.bActive)
			{
				let buttons: any = null;
				let className: string = 'chatinput';
				if (this.props.done)
				{
					buttons = (
						<span>
						<button id='ok' onClick={this.handleOKClick} ><img src='/ShowYes.png' /></button>&nbsp;
						<button id='cancel' onClick={this.handleOKClick} ><img src='/ShowNo.png' /></button>
						</span>
						);
					className = 'subtleinput';
				}
				return (
					<div>
						<input ref={(i)=>{this.elInput=i;}} className={className} id='edit' type='text' value={this.props.valEdit} onChange={this.handleTextChange} onKeyPress={this.handleTextReturn} />
						{buttons}
					</div>
					);
			}
			else
				return (<div>{this.props.val}</div>);
		}
}
