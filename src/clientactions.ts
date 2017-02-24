export const Home: number = 0;
export const NewScratch: number = 1;
export const NewChess: number = 2;
export const NewDoodle: number = 3;
export const ToggleChat: number = 4;
export const JoinSession: number = 5;

export interface IClientActions
{
	fire: (a: number, arg?: any) => void
}
