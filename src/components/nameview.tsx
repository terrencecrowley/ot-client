import * as React from "react";
import * as NameControl from "../namecontrol";
import * as IP from "./inputview";

export interface NameProps {
	nc: NameControl.NameControl
}

export interface NameState {
}

export class NameView extends React.Component<NameProps, NameState> {

	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
		}

	handleClick(e: any): boolean
		{
			this.props.nc.editName();

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let p: IP.InputProps = this.props.nc.propsName;

			return (
				<div onClick={this.handleClick} >
					<hr />
					<IP.InputView bImg={p.bImg} bFocus={p.bFocus} bActive={p.bActive} valEdit={p.valEdit} val={p.val} done={p.done} update={p.update} />
					<hr />
				</div>
				);
		}
}
