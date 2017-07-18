import * as $ from "jquery";
import * as React from "react";
import * as Menu from "../menu";
import * as MenuControl from "../menucontrol";

export interface MenuProps {
	menuControl: MenuControl.MenuControl
}

export interface MenuState {
}

let hideOnClickOutside: (e: any) => void = null;

function removeClickListener(): void
	{
		$('html').off('click', hideOnClickOutside);
	}

function addClickListener(): void
	{
		$('html').on('click', hideOnClickOutside);
	}

export class MenuView extends React.Component<MenuProps, MenuState> {

	bVisible: boolean;
	bAdded: boolean;

	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
			this.handleHtmlClick = this.handleHtmlClick.bind(this);
			this.cancel = this.cancel.bind(this);
			hideOnClickOutside = this.handleHtmlClick;

			this.bVisible = false;
			this.bAdded = false;
		}

	handleClick(e: any): boolean
		{
			this.props.menuControl.fire(e.currentTarget.id);

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	handleHtmlClick(e: any): void
		{
			if (! $(e.target).closest('#capturemenu').length)
			{
				if ($('#capturemenu'))
				{
					removeClickListener();
					this.cancel();
				}
			}
		}

	cancel(): void
		{
			this.props.menuControl.doneEdits(false);
		}

	componentDidUpdate(prevProps: MenuProps, prevState: MenuState): void
		{
			if (this.bVisible && !this.bAdded)
			{
				addClickListener();
				this.bAdded = true;
			}
			if (! this.bVisible && this.bAdded)
			{
				removeClickListener();
				this.bAdded = false;
			}
		} 

	render()
		{
			let p: Menu.IMenu = this.props.menuControl.props;
			if (p.choices)
			{
				this.bVisible = true;
				let menuStyle: any = { position: 'absolute', left: p.absx, top: p.absy };
				let choicesBlock: any[] = [];
				for (let i: number = 0; i < p.choices.length; i++)
					choicesBlock.push(
						<div id={p.choices[i][0]} className='menuchoice' onClick={this.handleClick}>
							{p.choices[i][1]}
						</div>
						);
				return (
					<div id='capturemenu' className="menu" style={menuStyle}>
						{choicesBlock}
					</div>
					);
			}
			else
			{
				this.bVisible = false;
				return null;
			}
		}
}
