import * as React from "react";
import { NavBar } from "./navbar";
import { BoardView } from "./boardview";
import { Message } from "./message";
import { Chat } from "./chat";
import * as Board from "../board";

export interface AppProps {
		name: string, 
		url: string,
		status: string,
		isChatOn: boolean,
		nChatSeen: number,
		chatArray: any,
		clientID: string,
		users: any,
		board: Board.Board,
		newCB: () => void,
		chatCB: () => void,
		submitChatCB: (s: string) => void,
		nameChangeCB: (s: string) => void,
		clickSquare: (id: number) => void
		}

export class ReactApp extends React.Component<AppProps, {}> {
	render()
		{
			let nChatUnseen: number = this.props.isChatOn ? 0 : this.props.chatArray.length - this.props.nChatSeen;
			let cmpNav: any = <NavBar url={this.props.url} name={this.props.name} nameChangeCB={this.props.nameChangeCB} newCB={this.props.newCB} chatCB={this.props.chatCB} isChatOn={this.props.isChatOn} nChatUnseen={nChatUnseen} board={this.props.board}/>;
			let cmpBoard: any = <BoardView board={this.props.board} clickSquare={this.props.clickSquare} />;
			let cmpChat: any = <Chat submitChatCB={this.props.submitChatCB} clientID={this.props.clientID} users={this.props.users} chatArray={this.props.chatArray} />;
			let cmpMessage: any = <Message status={this.props.status} />;

			if (this.props.isChatOn)
				return (
					<div className="wrapper">
						<div className="header">
						{cmpNav}
						</div>
						<div className="content inarow">
						{cmpBoard}
						{cmpChat}
						</div>
						<div className="footer">
						{cmpMessage}
						</div>
					</div>
					);
			else
				return (
					<div className="wrapper">
						<div className="header">
						{cmpNav}
						</div>
						<div className="content">
						{cmpBoard}
						</div>
						<div className="footer">
						{cmpMessage}
						</div>
					</div>
					);
		}
}
