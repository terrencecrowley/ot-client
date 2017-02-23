import * as React from "react";
import { NavBar } from "./navbar";
import { BoardView } from "./boardview";
import { StatusView } from "./statusview";
import { ChatView } from "./chatview";

import * as BC from "../boardcontrol";
import * as CC from "../chatcontrol";

export interface AppProps {
		name: string, 
		url: string,
		status: string,
		cc: CC.ChatControl,
		bc: BC.BoardControl,
		newCB: () => void,
		chatCB: () => void
		}

export class ReactApp extends React.Component<AppProps, {}> {
	render()
		{
			let nChatUnseen: number = this.props.cc.bChatOn ? 0 : this.props.cc.chatArray.length - this.props.cc.nChatSeen;
			let cmpNav: any = <NavBar url={this.props.url} name={this.props.name} newCB={this.props.newCB} chatCB={this.props.chatCB} isChatOn={this.props.cc.bChatOn} nChatUnseen={nChatUnseen} bc={this.props.bc}/>;
			let cmpBoard: any = <BoardView bc={this.props.bc} />;
			let cmpChat: any = <ChatView cc={this.props.cc} />;
			let cmpStatus: any = <StatusView status={this.props.status} />;

			if (this.props.cc.bChatOn)
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
						{cmpStatus}
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
						{cmpStatus}
						</div>
					</div>
					);
		}
}
