import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";

export class StatusControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;

	status: string;
	userMap: any;		// User names indexed by clientID
	reRender: () => void;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.userMap = {};
			this.handleJoin = this.handleJoin.bind(this);
			this.handleState = this.handleState.bind(this);
			cs.on('status', this.handleJoin);
			cs.on('join', this.handleJoin);
			cs.on('state', this.handleState);
		}

	doneEdits(ok: boolean): void
		{
		}

	handleJoin(cs: CS.ClientSession)
		{
			let newStatus: string;
			if (! cs.bConnected)
				newStatus = "Server unreachable.";
			else if (cs.bInSession)
			{
				if (cs.session.bReachable)
				{
					let nAnon: number = 0;
					let nOther: number = 0;
					for (var cid in this.userMap)
						if (this.userMap.hasOwnProperty(cid) && cid != cs.session.clientID)
						{
							nOther++;
							if (this.userMap[cid] == '')
								nAnon++;
						}
					if (nOther == 0)
						newStatus = "Connected, no other authors.";
					else
					{
						let statusBuild: string[] = [];
						statusBuild.push('Connected with ');
						if (nOther > nAnon)
						{
							let nNames: number = nOther - nAnon;
							let sFinalCombiner: string = nAnon == 0 ? ' and ' : ', ';
							for (var cid in this.userMap)
								if (this.userMap.hasOwnProperty(cid) && cid != cs.session.clientID && this.userMap[cid] != '')
								{
									statusBuild.push(this.userMap[cid]);
									nNames--;
									if (nNames == 1)
										statusBuild.push(sFinalCombiner);
									else if (nNames > 1)
										statusBuild.push(', ');
								}
							if (nAnon > 0)
								statusBuild.push(' and ');
						}
						statusBuild.push(nAnon == 0 ? '.' : (nAnon == 1 ? 'one other user.' : String(nAnon) + ' other users.'));

						newStatus = statusBuild.join('');
					}
				}
				else
					newStatus = "Session unavailable.";
			}
			else if (cs.session && cs.session.bFull)
				newStatus = "Session full, please wait.";
			else if (cs.bPendingConnection)
				newStatus = "Connecting to session...";
			else
				newStatus = "No current session.";

			// Only re-render as necessary
			if (newStatus != this.status)
			{
				this.status = newStatus;
				this.reRender();
			}
		}

	handleState(cs: CS.ClientSession, css: CS.ClientSessionState)
		{
			if (css && css.state)
				this.userMap = css.state['WellKnownName_users'];
			else
				this.userMap = {};

			this.handleJoin(cs);
		}
}
