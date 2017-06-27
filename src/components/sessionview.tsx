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
			this.handleClickNewPlan = this.handleClickNewPlan.bind(this);
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
			let sessionColumns: any = [];
			if (user.sessions && user.sessions.length > 0)
			{
				let sessionCells: any = [];
				// Name
				sessionCells.push(<div className='row sessioncell'><b>Name</b></div>);
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionCells.push(<div className='row sessioncell'>{s.sessionName}</div>);
				}
				sessionColumns.push(<div className='column'>{sessionCells}</div>);

				// Type
				sessionCells = [];
				sessionCells.push(<div className='row sessioncell'><b>Type</b></div>);
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionCells.push(<div className='row sessioncell'>{s.sessionType}</div>);
				}
				sessionColumns.push(<div className='column'>{sessionCells}</div>);

				// Active
				sessionCells = [];
				sessionCells.push(<div className='row sessioncell'><b>Active</b></div>);
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionCells.push(<div className='row sessioncell'>{String(s.clientCount) + ' active'}</div>);
				}
				sessionColumns.push(<div className='column'>{sessionCells}</div>);

				// Join
				sessionCells = [];
				sessionCells.push(<div className='row sessioncell'>&nbsp;</div>);
				for (let i: number = 0; i < user.sessions.length; i++)
				{
					let s: any = user.sessions[i];
					sessionCells.push(
						<div className='row sessioncell'>
							<button className={'actionButton'} onClick={this.handleClick} id={s.sessionID}>
								Join
							</button>
						</div>);
				}
				sessionColumns.push(<div className='column'>{sessionCells}</div>);
			}
			else
			{
				sessionColumns.push(<div>No Sessions</div>);
			}
			return (
					 <div>
						<div>
							Available Sessions:<br/><br/>
						</div>
						<div className='row'>
							{sessionColumns}
						</div>
						<div>
							<br/>
							<button className={'actionButton'} onClick={this.handleClickNewScratch}>New Text</button>
							&nbsp;
							<button className={'actionButton'} onClick={this.handleClickNewChess}>New Chess</button>
							&nbsp;
							<button className={'actionButton'} onClick={this.handleClickNewAgree}>New Agreed</button>
							&nbsp;
							<button className={'actionButton'} onClick={this.handleClickNewPlan}>New Plan</button>
						</div>
					 </div>
					);
		}
}
