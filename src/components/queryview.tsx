import * as React from "react";
import * as Query from "../agree";
import * as QueryControl from "../querycontrol";

export interface QueryProps {
	queryControl: QueryControl.QueryControl
}

export interface QueryState {
}

export class QueryView extends React.Component<QueryProps, QueryState> {

	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
		}

	handleClick(e: any): boolean
		{
			this.props.queryControl.fire(e.currentTarget.id == "ok");
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let p: any = this.props.queryControl.props;
			if (p.query)
			{
				let sYes: string = p.yes ? p.yes : "Yes";
				let sNo: string = p.no ? p.no : "No";
				return (
					<div className='query'>
						<img className="floating" src='/ShowMaybe.png' />
						<div>
							{p.query}
							<br />
							<br />
							<button id='ok' onClick={this.handleClick} >{sYes}</button>&nbsp;
							<button id='cancel' onClick={this.handleClick} >{sNo}</button>
						</div>
					</div>
					);
			}
			else
				return null;
		}
}
