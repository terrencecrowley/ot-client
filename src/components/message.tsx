import * as React from "react";

export interface MessageProps { status: string }

export class Message extends React.Component<MessageProps, {}> {
	render()
		{
			return ( <div>{this.props.status}</div> );
		}
}
