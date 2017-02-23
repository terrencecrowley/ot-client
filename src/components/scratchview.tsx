import * as $ from "jquery";
import * as React from "react";
import * as SC from "../scratchcontrol";


export interface ScratchProps
{
	sc: SC.ScratchControl
}

export class ScratchView extends React.Component<ScratchProps, {}> {

	constructor(props: any)
		{
			super(props);
			this.handleChange = this.handleChange.bind(this);
			this.handleCaptureSelection = this.handleCaptureSelection.bind(this);
		}

	handleChange(event: any): void
		{
			let el: any = $('#scratchpad')[0];
			this.props.sc.notifyLocalChange(event.target.value, el.selectionStart, el.selectionEnd);
		}

	handleCaptureSelection(event: any): void
		{
			let el: any = $('#scratchpad')[0];
			this.props.sc.notifyLocalChange(event.target.value, el.selectionStart, el.selectionEnd);
		}

	render()
		{
			return (
				<textarea id='scratchpad' ref={(textarea) => this.props.sc.captureElementCB(textarea)} onChange={this.handleChange} onKeyUp={this.handleCaptureSelection} onMouseUp={this.handleCaptureSelection} ></textarea>
				);
		}
}
