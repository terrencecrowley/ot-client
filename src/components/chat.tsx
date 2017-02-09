import * as $ from "jquery";
import * as React from "react";

export interface ChatProps {
	clientID: string,
	users: any,
	chatArray: any,
	submitChatCB: (s: string) => void
	}

export interface ChatState {
	text: string
	}

export class Chat extends React.Component<ChatProps, ChatState> {
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
				this.props.submitChatCB(event.target.value);
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
			let whoMe: string = this.props.clientID;
			let whoMap: any = this.props.users;
			const chatHistory = this.props.chatArray.map((chatEntry: any, i: number) => {
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
