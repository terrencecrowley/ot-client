export const Home: number = 0;
export const NewScratch: number = 1;
export const NewChess: number = 2;
export const NewPlan: number = 3;
export const NewAgree: number = 4;
export const ToggleChat: number = 5;
export const JoinSession: number = 6;
export const Query: number = 7;	// arg is { query: "", yes: "", no: "", callback: func }
export const Menu: number = 8; // arg is { absx: x, absy: y, choices: [ "1", "2" ], callback: func }
export const DoneEdits: number = 9;

export interface IClientActions
{
	fire: (a: number, arg?: any) => void
}
