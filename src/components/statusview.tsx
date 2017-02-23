import * as React from "react";

export interface StatusViewProps { status: string }

export class StatusView extends React.Component<StatusViewProps, {}> {
	render()
		{
			return ( <div>{this.props.status}</div> );
		}
}
