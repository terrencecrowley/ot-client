export type SyncChoice = [ string, string, string, string ];	// UID, type, start, end (type is "time", "place", "enum")

export class Agree
{
	// OT synchronized state
	meta: any;				// { name, dtype }			OTMap("meta")
	users: any;				// { UserSID: name }		OTMap("users")
	choices: SyncChoice[];	// Array of SyncChoice		OTArray("choices") - array to have order, but includes UID like map
	selects: any;			// { UserSID/UID: [0|1|2]}	OTMap("selects")

	constructor()
		{
			this.meta = { name: '', dtype: '' };
			this.users = {};
			this.choices = [];
			this.selects = {};
		}

	getUserList(): any[] // return array of { name: s, id: s }
		{
			let ret: any[] = [];
			for (var p in this.users)
				if (this.users.hasOwnProperty(p))
				{
					let o: any = { id: p, name: this.users[p] };
					ret.push(o);
				}
			return ret;
		}

	nextSelection(selProp: string): number
		{
			let sThis: number = this.selects[selProp];
			if (sThis === undefined)
				return 1;
			switch (sThis)
			{
				case -1:	return 1;
				case 0:		return 2;
				case 1:		return 0;
				case 2:		return 1;
				case 3:		default:	return -1;
			}
		}
}
