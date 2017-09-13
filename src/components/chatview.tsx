import * as $ from "jquery";
import * as React from "react";
import * as CC from "../chatcontrol";

export interface ChatProps {
	cc: CC.ChatControl
	}

export interface ChatState {
	text: string
	}

export class ChatView extends React.Component<ChatProps, ChatState> {
	constructor(props: any)
		{
			super(props);
			this.handleChange = this.handleChange.bind(this);
			this.handleReturn = this.handleReturn.bind(this);
			this.state = { text: '' };
		}

	handleChange(event: any): void
		{
			this.setState( { text: event.target.value } );
		}

	handleReturn(event: any): void
		{
			if (event.charCode == 13)
			{
				this.props.cc.notifyLocalChange(event.target.value);
				this.setState( { text: '' } );
			}
		}

	componentDidMount()
		{
			$('#chat').focus();
		}

	componentDidUpdate(prevProps: any, prevState: any): void
		{
			$('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
		}

	render()
		{
			let whoMe: string = this.props.cc.clientSession.session.clientID;
			let whoMap: any = this.props.cc.userMap;
			const chatHistory = this.props.cc.chatArray.map((chatEntry: any, i: number) => {
				let sWho: string = whoMap[chatEntry[0]];
				if (!sWho || sWho == '') sWho = chatEntry[0] == whoMe ? 'me' : 'anon';
				return (
					<li key={i}>
					{sWho}: {chatEntry[1]}
					</li>
				);
				});
			return (
				<div className="chatcontainer">
					<div id="chatbox" className="chatbox"><ol>{chatHistory}</ol></div>
					<input className="chatinput" id="chat" type="text" value={this.state.text} onChange={this.handleChange} onKeyPress={this.handleReturn} />
				</div> );
		}
}
