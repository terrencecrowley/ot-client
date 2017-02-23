import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as CS from "./clientsession";
import * as Board from "./board";

export class BoardControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;

	board: Board.Board;		// Local board state
	moves: number[];		// Remote synchronized log of moves

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void)
		{
			this.context = ctx;
			this.clientSession = cs;
			this.reRender = reRender;

			this.board = new Board.Board();
			this.moves = [];
			this.notifyBoardChange = this.notifyBoardChange.bind(this);
			cs.onChange('chess', this.notifyBoardChange);
		}

	reset(): void
		{
			this.board = new Board.Board();
			this.moves = [];
		}

	notifyBoardChange(cs: CS.ClientSession, moves: any)
		{
			this.moves = moves;
			this.syncMoves();
		}

	syncMoves(): void
		{
			// This simple sync algorithm presumes that there is actually turn-taking going on.
			let nLocalMoves: number = this.board.Moves.length;
			let nRemoteMoves: number = this.moves.length / 2;

			// If shared array is larger, make those moves in my local board state
			if (nRemoteMoves > nLocalMoves)
			{
				for (let i: number = nLocalMoves * 2; i < this.moves.length; i += 2)
					this.board.move(this.moves[i], this.moves[i+1]);
				this.board.setSelected(-1);
			}

			// If local number of moves is larger, share those moves
			else if (nLocalMoves > nRemoteMoves)
			{
				let cs: CS.ClientSession = this.clientSession;
				if (cs.clientEngine)
				{
					let editRoot: OT.OTCompositeResource = new OT.OTCompositeResource(cs.sessionID, cs.clientID);
					let editMoves: OT.OTArrayResource = new OT.OTArrayResource('chess');
					editMoves.edits.push([ OT.OpRetain, this.moves.length, [] ]);
					for (let i: number = nRemoteMoves; i < this.board.Moves.length; i++)
					{
						let m: Board.Move = this.board.Moves[i];
						editMoves.edits.push([ OT.OpInsert, 2, [ m[0], m[2] ] ]);
					}
					editRoot.edits.push(editMoves);
					cs.clientEngine.addLocal(editRoot);
					cs.tick();
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
			if (this.board.isTargeted(id))
			{
				this.board.move(this.board.selected, id);
				this.board.setSelected(-1);
				this.syncMoves();
			}
			else
				this.board.setSelected(id);
			this.reRender();
		}
}
