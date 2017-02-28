import * as React from "react";
import { NavBar } from "./navbar";
import { BoardView } from "./boardview";
import { StatusView } from "./statusview";
import { ChatView } from "./chatview";
import { ScratchView } from "./scratchview";
import { SessionView } from "./sessionview";
import { DoodleView } from "./doodleview";
import { IClientActions } from "../clientactions";

import * as SessionControl from "../sessioncontrol";
import * as BoardControl from "../boardcontrol";
import * as ChatControl from "../chatcontrol";
import * as ScratchControl from "../scratchcontrol";
import * as DoodleControl from "../doodlecontrol";

export interface AppProps {
		mode: string,
		name: string, 
		url: string,
		status: string,
		actions: IClientActions,
		sessionControl: SessionControl.SessionControl,
		chatControl: ChatControl.ChatControl,
		boardControl: BoardControl.BoardControl,
		scratchControl: ScratchControl.ScratchControl,
		doodleControl: DoodleControl.DoodleControl
		}

export class ReactApp extends React.Component<AppProps, {}> {
	render()
		{
			let statusLabel: string = this.props.mode === 'chess' ? this.props.boardControl.navText() : '';
			let cmpNav: any = <NavBar url={this.props.url} name={this.props.name} chatLabel={this.props.chatControl.navText()} actions={this.props.actions} statusLabel={statusLabel}/>;
			let cmpChat: any = this.props.chatControl.bChatOn ? <ChatView cc={this.props.chatControl} /> : null;
			let cmpStatus: any = <StatusView status={this.props.status} />;

			let cmpMain: any = null;

			switch (this.props.mode)
			{
				case 'chess':
					cmpMain = <BoardView bc={this.props.boardControl} />;
					break;

				case 'scratch':
					cmpMain = <ScratchView sc={this.props.scratchControl} />;
					break;

				case 'doodle':
					cmpMain = <DoodleView dc={this.props.doodleControl} />;
					break;

				default:
					cmpMain = <SessionView sc={this.props.sessionControl} />;
					break;
			}

			return (
				<div className="wrapper">
					<div className="header">
					{cmpNav}
					</div>
					<div className="content inarow">
					{cmpMain}
					{cmpChat}
					</div>
					<div className="footer">
					{cmpStatus}
					</div>
				</div>
				);
		}
}
