export interface IQuery
{
	query: string;
	yes: string;
	no: string;
	callback: (b: boolean) => void
}

export const NullQuery: IQuery = { query: null, yes: null, no: null, callback: null };
