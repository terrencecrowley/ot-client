import * as fs from 'fs';
import * as OT from '@terrencecrowley/ot-js';

const StateVersion: number = 2.0;

export class User
{
	id: string;
	token: string;
	name: string;
	email: string;

	constructor(o?: any)
		{
			if (o != undefined)
				this.fromJSON(o);
			else
			{
				this.id = '';
				this.token = '';
				this.name = '';
				this.email = '';
			}
		}

	toJSON(): any
		{
			return { id: this.id, token: this.token, name: this.name, email: this.email };
		}

	fromJSON(o: any): void
		{
			this.id = o.id;
			this.token = o.token;
			this.name = o.name;
			this.email = this.email;
		}
}

export class Users
{
	users: User[];
	private context: OT.IExecutionContext;
	private bDirty: boolean;
	private bSaving: boolean;

	// Constructor
	constructor(ctx: OT.IExecutionContext)
		{
			this.context = ctx;
			this.users = [];
			this.bDirty = false;
			this.bSaving = false;
			UserManager = this;
		}

	findByID(id: string): User
		{
			for (let i: number = 0; i < this.users.length; i++)
				if (this.users[i].id == id)
					return this.users[i];
			return null;
		}

	createUser(o: any): User
		{
			let u: User = new User(o);
			this.users.push(u);
			this.bDirty = true;
			this.save();
			return u;
		}

	toJSON(): any
		{
			let o: any = { version: StateVersion, users: [] };
			let aUsers: any[] = o.users;
			for (let i: number = 0; i < this.users.length; i++)
				aUsers.push(this.users[i].toJSON());
			return o;
		}

	fromJSON(o: any): void
		{
			if (o.version == StateVersion)
			{
				for (let i: number = 0; i < o.users.length; i++)
					this.users.push(new User(o.users[i]));
			}
			this.bDirty = false;
		}

	save(): void
		{
			try
			{
				if (this.bDirty && !this.bSaving)
				{
					let s: string = JSON.stringify(this);
					this.bSaving = true;
					fs.writeFile('state/users.json', s, (err) => {
							UserManager.bSaving = false;
							UserManager.bDirty = false;
							if (err) throw err;
						});
					this.context.log(0, "UserManager: state saved");
				}
			}
			catch (err)
			{
				this.context.log(0, "UserManager: save state failed: " + err);
			}
		}

	load(): void
		{
			try
			{
				let s: string = fs.readFileSync('state/users.json', 'utf8');
				let o: any = JSON.parse(s);
				this.fromJSON(o);
				this.bDirty = false;
			}
			catch (err)
			{
				this.context.log(0, "UserManager: load state failed: " + err);
			}
		}
}

let UserManager: Users;
