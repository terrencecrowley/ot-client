import * as React from "react";
import * as SC from "../sessioncontrol";
import * as ClientActions from "../clientactions";

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
			this.handleClickNewAgree = this.handleClickNewAgree.bind(this);
		}

	handleClick(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.JoinSession, e.currentTarget.id);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleClickNewScratch(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.NewScratch);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleClickNewChess(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.NewChess);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleClickNewAgree(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.NewAgree);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let user: any = this.props.sc.user;
			let sessionButtons: any = [];
			if (user.sessions)
			{
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionButtons[i] =
						(
							<div>
							<button className={'actionButton'} onClick={this.handleClick} id={s.sessionID}>
								Join
							</button>
							&nbsp;
							&nbsp;
							{s.sessionName}({s.sessionType}):&nbsp;{String(s.clientCount) + " users active"}
							<br/>
							</div>
						);
				}
			}
			else
			{
				sessionButtons.push(<div>No Sessions</div>);
			}
			return (
					 <div>
					 	Available Sessions:<br/><br/>
						{sessionButtons}
						<br/>
						<button className={'actionButton'} onClick={this.handleClickNewScratch}>New Text</button>
						&nbsp;
						<button className={'actionButton'} onClick={this.handleClickNewChess}>New Chess</button>
						&nbsp;
						<button className={'actionButton'} onClick={this.handleClickNewAgree}>New Agreed</button>
					 </div>
					);
		}
}
