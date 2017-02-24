import * as $ from "jquery";
import * as React from "react";
import * as ClientActions from "../clientactions";

export interface NavProps {
	url: string,
	name: string,
	statusLabel: string,
	chatLabel: string,
	actions: ClientActions.IClientActions
	}

export interface NavState {
	username: string
	}

export class NavBar extends React.Component<NavProps, NavState> {
	constructor(props: any)
		{
			super(props);

			this.handleHome = this.handleHome.bind(this);
			this.handleChat = this.handleChat.bind(this);
			this.handleShare = this.handleShare.bind(this);
			this.handleDismiss = this.handleDismiss.bind(this);
			this.handleCopyClick = this.handleCopyClick.bind(this);

			this.state = { username: props.name };
		}

	handleCopyClick()
		{
			$('#nav').focus();
			$('#nav').select();
			document.execCommand('copy');
		}

	handleHome(e: any): boolean
		{
			this.props.actions.fire(ClientActions.Home);

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleChat(e: any): boolean
		{
			this.props.actions.fire(ClientActions.ToggleChat);

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleShare(e: any): boolean
		{
			e.preventDefault();
			e.stopPropagation();
			$('#popup-share').css('display', 'flex');
			$('#nav').focus();
			$('#nav').select();
			document.execCommand('copy');
			return false;
		}

	handleDismiss(e: any): boolean
		{
			e.preventDefault();
			e.stopPropagation();
			$('#popup-share').css('display', 'none');
			return false;
		}

	render()
		{
			let cmpMenus: any = null;
			if (this.props.url == '')
			{
				cmpMenus = (
					<div>
					<a href="/">Home</a>&nbsp; | &nbsp;{this.props.name}&nbsp;
					</div>
					);
			}
			else
			{
				cmpMenus = (
					<div>
					<a href="#home" onClick={this.handleHome}>Home</a>&nbsp; | &nbsp;<a href="#share" onClick={this.handleShare}>Share</a>&nbsp; | &nbsp;<a href="#chat" onClick={this.handleChat}>{this.props.chatLabel}</a>&nbsp; | &nbsp;{this.props.name}&nbsp; | &nbsp;{this.props.statusLabel}
					</div>
					);
			}
			return (
				<div className="headerrow">
					{cmpMenus}
					<div id="popup-share" className="popup">Copy and share this url:<br/>
						<input id="nav" className="line" type="text" value={this.props.url} readOnly={true}/><br/>
						<a href="#dismiss" onClick={this.handleDismiss}>Close</a>
					</div>
				</div>
				);
		}
}
