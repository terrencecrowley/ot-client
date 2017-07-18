export type IMenuItem = [ string, string ];	// id, label
export interface IMenu
{
	absx: number;
	absy: number;
	choices: IMenuItem[];
	callback: (result: string) => void
}

export const NullMenu: IMenu = { absx: null, absy: null, choices: null, callback: null };

export function createEmpty(): IMenu
	{
		return { absx: null, absy: null, choices: null, callback: null };
	}
