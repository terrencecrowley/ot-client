import * as React from "react";

export interface InputProps {
	bImg: boolean,
	bActive: boolean,
	bFocus: boolean,
	bFaded: boolean,
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
			this.handleBlur = this.handleBlur.bind(this);
		}

	handleTextChange(event: any): void
		{
			if (this.props.bActive)
				this.props.update(event.target.value);
		}

	handleTextReturn(event?: any): void
		{
			if (event === undefined || event.charCode == 13)
			{
				if (this.props.bActive)
				{
					if (this.props.done)
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

	handleBlur(e: any): boolean
		{
			if (this.props.done && this.props.val != '' && ! this.props.bImg) this.props.done(false);
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
				if (this.props.done && this.props.bImg)
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
						<input className={className} id={id} type='text' value={this.props.valEdit} onChange={this.handleTextChange} onKeyPress={this.handleTextReturn} onBlur={this.handleBlur} />
						{buttons}
					</div>
					);
			}
			else
			{
				if (this.props.bFaded)
					return (<div className='faded'>{this.props.val}</div>);
				else
					return (<div>{this.props.val}</div>);
			}
		}
}
