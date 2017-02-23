import * as React from "react";
import * as SC from "../sessioncontrol";

export interface SessionProps {
	sc: SC.SessionControl
}

export interface SessionState { }

export class SessionView extends React.Component<SessionProps, SessionState> {
	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
			this.handleClickNewScratch = this.handleClickNewScratch.bind(this);
			this.handleClickNewChess = this.handleClickNewChess.bind(this);
		}

	handleClick(e: any): boolean
		{
			//this.props.sc.joinSession(e.currentTarget.id);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleClickNewScratch(e: any): boolean
		{
			//this.props.sc.newScratchSession();
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleClickNewChess(e: any): boolean
		{
			//this.props.sc.newChessSession();
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let user: any = this.props.sc.user;
			if (user.sessions)
			{
				let sessionButtons: any = [];
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionsButtons[i] =
						(
							<div>
							<button onClick={this.handleClick} id={s.sessionID}>
								{s.sessionType}&nbsp;{String(s.clientCount) + " users active"}
							</button>
							</br>
							</div>
						);
				}
				return (
						 <div>
						 	{sessionButtons}
							<button onClick={this.handleClickNewScratch}>New Scratch</button>
							<button onClick={this.handleClickNewChess}>New Chess</button>
						 </div>
						);
			}
		}
}
