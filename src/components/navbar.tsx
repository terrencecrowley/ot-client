import * as $ from "jquery";
import * as React from "react";
import * as Board from "../board";
import * as BC from "../boardcontrol";

export interface NavProps {
	url: string,
	name: string,
	isChatOn: boolean,
	nChatUnseen: number,
	newCB: () => void,
	chatCB: () => void,
	bc: BC.BoardControl
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
			this.state = { username: props.name };
		}

	handleCopyClick()
		{
			$('#nav').focus();
			$('#nav').select();
			document.execCommand('copy');
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

	render()
		{
			let chatString: string = this.props.isChatOn ? "Hide Chat" : "Chat";
			if (this.props.nChatUnseen > 0)
				chatString += "(" + String(this.props.nChatUnseen) + ")";
			let nameString: string = this.props.name == '' ? "Set Name" : this.props.name;
			let colorString: string = this.props.bc.board.whoseMove() == Board.Black ? "Black Moves" : "White Moves";
			let checkString: string = this.props.bc.board.isCheck(this.props.bc.board.whoseMove()) ? " / Check" : "";
			return (
				<div className="headerrow">
					<a href="/">Home</a>&nbsp; | &nbsp;<a href="#share" onClick={this.handleShare}>Share</a>&nbsp; | &nbsp;<a href="#new" onClick={this.handleNew}>New</a>&nbsp; | &nbsp;<a href="#chat" onClick={this.handleChat}>{chatString}</a>&nbsp; | &nbsp;{nameString}&nbsp; | &nbsp;{colorString + checkString}
					<div id="popup-share" className="popup">Copy and share this url:<br/>
						<input id="nav" className="line" type="text" value={this.props.url} readOnly={true}/><br/>
						<a href="#dismiss" onClick={this.handleDismiss}>Close</a>
					</div>
				</div>
				);
		}
}
