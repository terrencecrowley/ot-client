import * as React from "react";
import { NavBar } from "./navbar";
import { ChessView } from "./chessview";
import { PlanView } from "./planview";
import { StatusView } from "./statusview";
import { ChatView } from "./chatview";
import { NameView } from "./nameview";
import { QueryView } from "./queryview";
import { ScratchView } from "./scratchview";
import { SessionView } from "./sessionview";
import { AgreeView } from "./agreeview";
import { IClientActions } from "../clientactions";

import * as SessionControl from "../sessioncontrol";
import * as ChessControl from "../chesscontrol";
import * as PlanControl from "../plancontrol";
import * as ChatControl from "../chatcontrol";
import * as NameControl from "../namecontrol";
import * as QueryControl from "../querycontrol";
import * as ScratchControl from "../scratchcontrol";
import * as AgreeControl from "../agreecontrol";

export interface AppProps {
		mode: string,
		name: string, 
		url: string,
		status: string,
		actions: IClientActions,
		sessionControl: SessionControl.SessionControl,
		chatControl: ChatControl.ChatControl,
		nameControl: NameControl.NameControl,
		queryControl: QueryControl.QueryControl,
		chessControl: ChessControl.ChessControl,
		planControl: PlanControl.PlanControl,
		scratchControl: ScratchControl.ScratchControl,
		agreeControl: AgreeControl.AgreeControl
		}

export class ReactApp extends React.Component<AppProps, {}> {
	render()
		{
			let statusLabel: string = this.props.mode === 'chess' ? this.props.chessControl.navText() : '';
			let cmpNav: any = <NavBar url={this.props.url} name={this.props.name} chatLabel={this.props.chatControl.navText()} actions={this.props.actions} statusLabel={statusLabel}/>;
			let cmpChat: any = this.props.chatControl.bChatOn ? <ChatView cc={this.props.chatControl} /> : null;
			let cmpStatus: any = <StatusView status={this.props.status} />;
			let cmpName: any = <NameView nc={this.props.nameControl} />;
			let cmpMain: any = null;

			switch (this.props.mode)
			{
				case 'chess':
					cmpMain = <ChessView chessControl={this.props.chessControl} />;
					break;

				case 'scratch':
					cmpMain = <ScratchView sc={this.props.scratchControl} />;
					break;

				case 'agree':
					cmpMain = <AgreeView agreeControl={this.props.agreeControl} />;
					break;

				case 'plan':
					cmpMain = <PlanView planControl={this.props.planControl} />;
					break;

				default:
					cmpMain = <SessionView sc={this.props.sessionControl} />;
					cmpName = null;
					break;
			}

			return (
				<div className="wrapper">
					<QueryView queryControl={this.props.queryControl} />
					<div className="header">
					{cmpNav}
					{cmpName}
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
