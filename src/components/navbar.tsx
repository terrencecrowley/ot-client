import * as $ from "jquery";
import * as React from "react";
import * as Board from "../board";

export interface NavProps {
	url: string,
	name: string,
	isChatOn: boolean,
	nChatUnseen: number,
	nameChangeCB: (s: string) => void,
	newCB: () => void,
	chatCB: () => void,
	board: Board.Board
	}

export interface NavState {
	username: string
	}

export class NavBar extends React.Component<NavProps, NavState> {
	constructor(props: any)
		{
			super(props);
			this.handleNew = this.handleNew.bind(this);
			this.handleShare = this.handleShare.bind(this);
			this.handleChat = this.handleChat.bind(this);
			this.handleDismiss = this.handleDismiss.bind(this);
			this.handleCopyClick = this.handleCopyClick.bind(this);
			this.handleDisplayName = this.handleDisplayName.bind(this);
			this.handleSetName = this.handleSetName.bind(this);
			this.handleChange = this.handleChange.bind(this);
			this.handleReturn = this.handleReturn.bind(this);
			this.state = { username: props.name };
		}

	handleCopyClick()
		{
			$('#nav').focus();
			$('#nav').select();
			document.execCommand('copy');
		}

	handleChange(e: any): void
		{
			this.setState( { username: e.target.value } );
		}

	handleReturn(e: any): boolean
		{
			if (e.charCode == 13)
			{
				return this.handleSetName(e);
			}
		}

	handleNew(e: any): boolean
		{
			this.props.newCB();

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChat(e: any): boolean
		{
			this.props.chatCB();

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleShare(e: any): boolean
		{
			e.preventDefault();
			e.stopPropagation();
			$('#popup-share').css('display', 'flex');
			$('#nav').focus();
			$('#nav').select();
			document.execCommand('copy');
			return false;
		}

	handleDismiss(e: any): boolean
		{
			e.preventDefault();
			e.stopPropagation();
			$('#popup-share').css('display', 'none');
			return false;
		}

	handleDisplayName(e: any): boolean
		{
			e.preventDefault();
			e.stopPropagation();
			this.setState({ username: this.props.name });
			$('#popup-user').css('display', 'flex');
			$('#username').focus();
			$('#username').select();
			return false;
		}

	handleSetName(e: any): boolean
		{
			e.preventDefault();
			e.stopPropagation();
			$('#popup-user').css('display', 'none');
			this.props.nameChangeCB(this.state.username);
			return false;
		}

	render()
		{
			let chatString: string = this.props.isChatOn ? "Hide Chat" : "Chat";
			if (this.props.nChatUnseen > 0)
				chatString += "(" + String(this.props.nChatUnseen) + ")";
			let nameString: string = this.props.name == '' ? "Set Name" : this.props.name;
			let colorString: string = this.props.board.whoseMove() == Board.Black ? "Black Moves" : "White Moves";
			return (
				<div className="headerrow">
					<a href="/">Home</a>&nbsp; | &nbsp;<a href="#share" onClick={this.handleShare}>Share</a>&nbsp; | &nbsp;<a href="#new" onClick={this.handleNew}>New</a>&nbsp; | &nbsp;<a href="#chat" onClick={this.handleChat}>{chatString}</a>&nbsp; | &nbsp;<a href="#namechange" onClick={this.handleDisplayName}>{nameString}</a>&nbsp; | &nbsp;{colorString}
					<div id="popup-share" className="popup">Copy and share this url:<br/>
						<input id="nav" className="line" type="text" value={this.props.url} readOnly={true}/><br/>
						<a href="#dismiss" onClick={this.handleDismiss}>Close</a>
					</div>
					<div id="popup-user" className="popup">User:<br/>
						<input id="username" className="line" type="text" value={this.state.username} onChange={this.handleChange} onKeyPress={this.handleReturn} /><br/>
						<a href="#dismiss" onClick={this.handleSetName}>Close</a>
					</div>
				</div>
				);
		}
}
