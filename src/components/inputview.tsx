import * as React from "react";

export interface InputProps {
	bActive: boolean,
	bFocus: boolean,
	val: string,
	valEdit: string,
	update: (val: string) => void,
	done: (ok: boolean) => void
}

export interface InputState {
}

export class InputView extends React.Component<InputProps, InputState> {

	constructor(props: any)
		{
			super(props);
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

	render()
		{
			if (this.props.bActive)
			{
				let buttons: any = null;
				let className: string = 'chatinput';
				let id: string = this.props.bFocus ? 'autofocus' : 'nofocus';
				if (this.props.done)
				{
					buttons = (
						<span>
						&nbsp;
						<button id='ok' onClick={this.handleOKClick} ><img src='/ShowYes.png' /></button>&nbsp;
						<button id='cancel' onClick={this.handleOKClick} ><img src='/ShowNo.png' /></button>
						</span>
						);
				}
				else
					className = 'subtleinput';

				return (
					<div>
						<input className={className} id={id} type='text' value={this.props.valEdit} onChange={this.handleTextChange} onKeyPress={this.handleTextReturn} />
						{buttons}
					</div>
					);
			}
			else
			{
				return (<div>{this.props.val}</div>);
			}
		}
}
