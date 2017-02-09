import * as $ from "jquery";
import * as React from "react";


export interface ScratchProps {
	captureElementCB: (el: any) => void,
	contentChangeCB: (s: string, ss: number, se: number) => void
}

export class ScratchPad extends React.Component<ScratchProps, {}> {

	constructor(props: any)
		{
			super(props);
			this.handleChange = this.handleChange.bind(this);
			this.handleCaptureSelection = this.handleCaptureSelection.bind(this);
		}

	handleChange(event: any): void
		{
			let el: any = $('#scratchpad')[0];
			this.props.contentChangeCB(event.target.value, el.selectionStart, el.selectionEnd);
		}

	handleCaptureSelection(event: any): void
		{
			let el: any = $('#scratchpad')[0];
			this.props.contentChangeCB(event.target.value, el.selectionStart, el.selectionEnd);
		}

	render()
		{
			return (
				<textarea id='scratchpad' ref={(textarea) => this.props.captureElementCB(textarea)} onChange={this.handleChange} onKeyUp={this.handleCaptureSelection} onMouseUp={this.handleCaptureSelection} ></textarea>
				);
		}
}
