import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as Chess from "./chess";
import * as ClientActions from "./clientactions";

export class ChessControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	chess: Chess.Chess;		// Local board state
	moves: number[];		// Remote synchronized log of moves

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;
			this.actions = actions;

			this.chess = new Chess.Chess();
			this.moves = [];
			this.notifyBoardChange = this.notifyBoardChange.bind(this);
			cs.onData('chess', this.notifyBoardChange);
		}

	navText(): string
		{
			let color: number = this.chess.whoseMove();
			let colorString: string = color == Chess.Black ? "Black Moves" : "White Moves";
			let checkString: string = this.chess.isMate() ? " / Mate" : (this.chess.isCheck(color) ? " / Check" : "");
			return colorString + checkString;
		}

	reset(): void
		{
			this.chess = new Chess.Chess();
			this.moves = [];
		}

	doneEdits(ok: boolean): void
		{
		}

	notifyBoardChange(cs: CS.ClientSession, moves: any)
		{
			if (moves === undefined)
				this.reset();
			else
			{
				this.moves = moves;
				this.syncMoves();
			}
		}

	syncMoves(): void
		{
			// This simple sync algorithm presumes that there is actually turn-taking going on.
			let nLocalMoves: number = this.chess.Moves.length;
			let nRemoteMoves: number = this.moves.length / 2;

			// If shared array is larger, make those moves in my local chess state
			if (nRemoteMoves > nLocalMoves)
			{
				for (let i: number = nLocalMoves * 2; i < this.moves.length; i += 2)
					this.chess.move(this.moves[i], this.moves[i+1]);
				this.chess.setSelected(-1);
			}

			// If local number of moves is larger, share those moves
			else if (nLocalMoves > nRemoteMoves)
			{
				let css: CS.ClientSessionState = this.clientSession.session;
				if (css.clientEngine)
				{
					let editRoot = css.startLocalEdit();
					let editMoves: OT.OTArrayResource = new OT.OTArrayResource('chess');
					editMoves.edits.push([ OT.OpRetain, this.moves.length, [] ]);
					for (let i: number = nRemoteMoves; i < this.chess.Moves.length; i++)
					{
						let m: Chess.Move = this.chess.Moves[i];
						editMoves.edits.push([ OT.OpInsert, 2, [ m[0], m[2] ] ]);
					}
					editRoot.edits.push(editMoves);
					css.addLocal(editRoot);
					css.tick();
				}
			}
			this.reRender();
		}

	clickSquare(id: number): void
		{
			// If no square is selected
			//	AND there is a piece at the clicked location
			//	AND it is the color who gets to move
			//	THEN set it as the selected square
			// If a square is selected
			//	AND the clicked square is one of the legal target squares
			//	THEN move the selected piece to the clicked square
			// Else If a square is selected
			//	AND there is a piece at the clicked location
			//	AND it is the color who gets to move
			//	THEN set it as the selected square
			if (this.chess.isTargeted(id))
			{
				this.chess.move(this.chess.selected, id);
				this.chess.setSelected(-1);
				this.syncMoves();
			}
			else
				this.chess.setSelected(id);
			this.reRender();
		}
}
