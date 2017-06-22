export const Home: number = 0;
export const NewScratch: number = 1;
export const NewChess: number = 2;
export const NewPlan: number = 3;
export const NewAgree: number = 4;
export const ToggleChat: number = 5;
export const JoinSession: number = 6;
export const Query: number = 7;	// arg is { query: "", yes: "", no: "", callback: func }
export const DoneEdits: number = 8;

export interface IClientActions
{
	fire: (a: number, arg?: any) => void
}
