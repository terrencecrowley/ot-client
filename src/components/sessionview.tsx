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
			this.handleClickJoin = this.handleClickJoin.bind(this);
			this.handleClickLeave = this.handleClickLeave.bind(this);
			this.handleClickNewScratch = this.handleClickNewScratch.bind(this);
			this.handleClickNewChess = this.handleClickNewChess.bind(this);
			this.handleClickNewPlan = this.handleClickNewPlan.bind(this);
			this.handleClickNewAgree = this.handleClickNewAgree.bind(this);
		}

	handleClickJoin(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.JoinSession, e.currentTarget.id);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleClickLeave(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.LeaveSession, e.currentTarget.id);
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

	handleClickNewPlan(e: any): boolean
		{
			this.props.sc.actions.fire(ClientActions.NewPlan);
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
			let sessionRows: any = [];
			if (user.sessions && user.sessions.length > 0)
			{
				let sessionCells: any = [];
				// Name
				sessionCells.push(<div className='sessioncell'><b>Name</b></div>);
				sessionCells.push(<div className='sessioncell'><b>Type</b></div>);
				sessionCells.push(<div className='sessioncell'><b>Active</b></div>);
				sessionCells.push(<div className='sessioncell'>&nbsp;</div>);
				sessionRows.push(<div className='tablerow'>{sessionCells}</div>);
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionCells = [];
					sessionCells.push(<div className='sessioncell'>{s.sessionName}</div>);
					sessionCells.push(<div className='sessioncell'>{s.sessionType}</div>);
					sessionCells.push(<div className='sessioncell'>{String(s.clientCount) + ' active'}</div>);
					sessionCells.push(
						<div className='sessioncell'>
							<button className={'actionButton'} onClick={this.handleClickJoin} id={s.sessionID}>
								Join
							</button>
							&nbsp;
							<button className={'actionButton'} onClick={this.handleClickLeave} id={s.sessionID}>
								Leave
							</button>
						</div>);
					sessionRows.push(<div className='tablerow'>{sessionCells}</div>);
				}
			}
			else
			{
				sessionRows.push(<div>No Sessions</div>);
			}
			return (
					 <div>
						<div>
							Available Sessions:<br/><br/>
						</div>
						<div className='table'>
							{sessionRows}
						</div>
						<div>
							<br/>
							<button className='actionButton' onClick={this.handleClickNewScratch}>New Text</button>
							&nbsp;
							<button className='actionButton' onClick={this.handleClickNewChess}>New Chess</button>
							&nbsp;
							<button className='actionButton' onClick={this.handleClickNewAgree}>New Agreed</button>
							&nbsp;
							<button className='actionButton' onClick={this.handleClickNewPlan}>New Plan</button>
						</div>
					 </div>
					);
		}
}
