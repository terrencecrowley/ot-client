// TODO:
//	En Passant
//	Castling
//	No Castling under jeopardy
//	Stalemate due to endless repetition
//	Pawn reaching final row

export const Empty: number = 0;
export const Pawn: number = 1;
export const Knight: number = 2;
export const Bishop: number = 4;
export const Rook: number = 8;
export const Queen: number = 16;
export const King: number = 32;
export const Black: number = 64;
export const White: number = 128;

let InitialBoard: number[] = [
	White|Rook,White|Knight,White|Bishop,White|King,White|Queen,White|Bishop,White|Knight,White|Rook,
	White|Pawn,White|Pawn,White|Pawn,White|Pawn,White|Pawn,White|Pawn,White|Pawn,White|Pawn,
	Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty,
	Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty,
	Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty,
	Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty,
	Black|Pawn,Black|Pawn,Black|Pawn,Black|Pawn,Black|Pawn,Black|Pawn,Black|Pawn,Black|Pawn,
	Black|Rook,Black|Knight,Black|Bishop,Black|King,Black|Queen,Black|Bishop,Black|Knight,Black|Rook
];

// TODO: Can't encode Castle and En Passant
export type Move = [number, number, number, number]; // StartPos, PieceValue, EndPos, PreviousPiece

function indexRC(r: number, c: number): number { return r*8+c; }
function invertColor(c: number) { return c == White ? Black : White; }

export class Chess
{
	Squares: number[];
	Captured: number[];
	Moves: Move[];
	Castled: number;	// Flags for Black and White
	Selected: number;
	Targets: number[];

	constructor()
		{
			this.Squares = new Array(64);
			for (let i: number = 0; i < 64; i++) this.Squares[i] = InitialBoard[i];
			this.Moves = [];
			this.Castled = 0; // Or in Black or White
			this.Selected = -1;
			this.Targets = [];
		}

	get selected(): number
		{
			return this.Selected;
		}

	get targets(): number[]
		{
			return this.Targets;
		}

	isTargeted(n: number): boolean
		{
			for (let i: number = 0; i < this.Targets.length; i++) if (this.Targets[i] == n) return true;
			return false;
		}

	setSelected(n: number)
		{
			if (this.colorAt(n) == this.whoseMove())
				this.Selected = n;
			else
				this.Selected = -1;

			if (this.Selected == -1)
				this.Targets = [];
			else
				this.Targets = this.getLegalMoves(this.Selected);
		}

	colorAt(n: number)
		{
			return (n >= 0 && n < 64) ? (this.Squares[n] & (Black|White)) : 0;
		}

	pieceAt(n: number)
		{
			return (n >= 0 && n < 64) ? (this.Squares[n] & (~(Black|White))) : Empty;
		}

	rowAt(n: number)
		{
			return Math.floor(n / 8);
		}

	colAt(n: number)
		{
			return n % 8;
		}

	findPiece(piece: number): number
		{
			for (let i: number = 0; i < 64; i++)
				if (this.Squares[i] == piece)
					return i;
			return -1;
		}

	isPathEmpty(start: number, end: number): boolean
		{
			let sRow = Math.floor(start / 8);
			let sCol = start % 8;
			let eRow = Math.floor(end / 8);
			let eCol = end % 8;
			let rIncr = sRow == eRow ? 0 : (sRow > eRow ? -1 : 1);
			let cIncr = sCol == eCol ? 0 : (sCol > eCol ? -1 : 1);
			for (sRow += rIncr, sCol += cIncr; sRow != eRow; sRow += rIncr, sCol += cIncr)
				if (this.Squares[indexRC(sRow, sCol)] != Empty) return false;
			return true;
		}

	getLegalSingle(eRow: number, eCol: number, sColor: number, moves: number[]): boolean
		{
			if (eRow < 0 || eRow > 7 || eCol < 0 || eCol > 7) return true;

			let end: number = indexRC(eRow, eCol);
			let endPiece: number = this.Squares[end];
			if (endPiece == Empty)
			{
				moves.push(end);
				return false;
			}
			else
			{
				if ((endPiece & sColor) == 0)
					moves.push(end);
				return true;
			}
		}

	getLegalSequence(sRow: number, sCol: number, incrRow: number, incrCol: number, sColor: number, moves: number[]): void
		{
			let eRow: number = sRow + incrRow;
			let eCol: number = sCol + incrCol;

			for (; eRow >= 0 && eRow < 8 && eCol >= 0 && eCol < 8; eRow += incrRow, eCol += incrCol)
				if (this.getLegalSingle(eRow, eCol, sColor, moves))
					break;
		}

	getLegalMovesUnfiltered(start: number, moves: number[] = []): number[]
		{
			let piece: number = this.Squares[start];
			let color: number = piece & (Black|White);
			let iColor: number = invertColor(color);
			piece -= color;
			let sRow: number = Math.floor(start / 8);
			let sCol: number = start % 8;
			let incr: number;
			let bAtInit: boolean;

			switch (piece)
			{
				case Empty:
					break;
				case Pawn:
					{
						incr = color == White ? 1 : -1;
						bAtInit = color == White ? sRow == 1 : sRow == 6;
						let colorMove1: number = this.colorAt(indexRC(sRow+incr, sCol));
						let colorMove2: number = this.colorAt(indexRC(sRow+(2*incr), sCol));
						let colorAttack1: number = this.colorAt(indexRC(sRow+incr, sCol+1));
						let colorAttack2: number = this.colorAt(indexRC(sRow+incr, sCol-1));
						if (colorMove1 == Empty)
							moves.push(indexRC(sRow+incr, sCol));
						if (bAtInit && colorMove1 == Empty && colorMove2 == Empty)
							moves.push(indexRC(sRow+(2*incr), sCol));
						if (colorAttack1 == iColor)
							moves.push(indexRC(sRow+incr, sCol+1));
						if (colorAttack2 == iColor)
							moves.push(indexRC(sRow+incr, sCol-1));
						// TODO: En Passant
					}
					break;
				case Knight:
					this.getLegalSingle(sRow+2, sCol+1, color, moves);
					this.getLegalSingle(sRow-2, sCol+1, color, moves);
					this.getLegalSingle(sRow+2, sCol-1, color, moves);
					this.getLegalSingle(sRow-2, sCol-1, color, moves);
					this.getLegalSingle(sRow+1, sCol+2, color, moves);
					this.getLegalSingle(sRow-1, sCol+2, color, moves);
					this.getLegalSingle(sRow+1, sCol-2, color, moves);
					this.getLegalSingle(sRow-1, sCol-2, color, moves);
					break;
				case Bishop:
					this.getLegalSequence(sRow, sCol, 1, 1, color, moves);
					this.getLegalSequence(sRow, sCol, -1, -1, color, moves);
					this.getLegalSequence(sRow, sCol, -1, 1, color, moves);
					this.getLegalSequence(sRow, sCol, 1, -1, color, moves);
					break;
				case Rook:
					this.getLegalSequence(sRow, sCol, 1, 0, color, moves);
					this.getLegalSequence(sRow, sCol, 0, 1, color, moves);
					this.getLegalSequence(sRow, sCol, -1, 0, color, moves);
					this.getLegalSequence(sRow, sCol, 0, -1, color, moves);
					break;
				case Queen:
					this.getLegalSequence(sRow, sCol, 1, 1, color, moves);
					this.getLegalSequence(sRow, sCol, -1, -1, color, moves);
					this.getLegalSequence(sRow, sCol, -1, 1, color, moves);
					this.getLegalSequence(sRow, sCol, 1, -1, color, moves);
					this.getLegalSequence(sRow, sCol, 1, 0, color, moves);
					this.getLegalSequence(sRow, sCol, 0, 1, color, moves);
					this.getLegalSequence(sRow, sCol, -1, 0, color, moves);
					this.getLegalSequence(sRow, sCol, 0, -1, color, moves);
					break;
				case King:
					this.getLegalSingle(sRow+1, sCol+1, color, moves);
					this.getLegalSingle(sRow+1, sCol+0, color, moves);
					this.getLegalSingle(sRow+1, sCol-1, color, moves);
					this.getLegalSingle(sRow+0, sCol+1, color, moves);
					this.getLegalSingle(sRow+0, sCol-1, color, moves);
					this.getLegalSingle(sRow-1, sCol+1, color, moves);
					this.getLegalSingle(sRow-1, sCol+0, color, moves);
					this.getLegalSingle(sRow-1, sCol-1, color, moves);
					break;
			}

			return moves;
		}

	getLegalMoves(start: number, moves: number[] = []): number[]
		{
			let color: number = this.colorAt(start);
			let potentialMoves: number[] = [];
			this.getLegalMovesUnfiltered(start, potentialMoves);

			// Now filter out moves that leave me in check
			for (let i: number = 0; i < potentialMoves.length; i++)
			{
				this.move(start, potentialMoves[i]);
				if (! this.isCheck(color))
					moves.push(potentialMoves[i]);
				this.undo();
			}

			return moves;
		}

	isMoveLegal(start: number, end: number): boolean
		{
			// Need to be on board
			if (start < 0 || start >= 64) return false;

			// Need to stay on board
			if (end < 0 || end >= 64) return false;

			// Need to actually move
			if (start == end) return false;

			// Needs to be a piece at starting square
			if (this.Squares[start] == Empty) return false;

			let moves: number[] = this.getLegalMoves(start);
			for (let i: number = 0; i < moves.length; i++)
				if (moves[i] == end)
					return true;
			return false;
		}

	move(start: number, end: number): void
		{
			let m: Move = [ start, this.Squares[start], end, this.Squares[end] ];
			this.Squares[end] = this.Squares[start];
			// Really should be user choice...
			if (this.pieceAt(end) == Pawn && (this.rowAt(end) == 0 || this.rowAt(end) == 7))
				this.Squares[end] = this.colorAt(end) | Queen;
			this.Squares[start] = Empty;
			this.Moves.push(m);
		}

	undo(): void
		{
			let m: Move = this.Moves[this.Moves.length-1];
			this.Moves.splice(this.Moves.length-1);
			this.Squares[m[0]] = m[1];
			this.Squares[m[2]] = m[3];
		}

	castle(color: number, kingside: boolean): void
		{
		}

	isCheck(color: number): boolean
		{
			let iColor: number = invertColor(color);
			let n: number = this.findPiece(color|King);
			for (let i: number = 0; i < 64; i++)
				if (this.colorAt(i) == iColor)
				{
					let moves: number[] = this.getLegalMovesUnfiltered(i);
					for (let j: number = 0; j < moves.length; j++)
						if (moves[j] == n)
							return true;
				}
			return false;
		}

	isMate(): number // Black and/or White returned
		{
			let colorMove: number = this.whoseMove();
			let color: number = 0;

			if (this.isCheck(colorMove))
			{
				let n: number = this.findPiece(colorMove|King);
				let moves: number[] = this.getLegalMoves(n);
				if (moves.length == 0) color |= colorMove;
			}

			return color;
		}

	isStalemate(): boolean
		{
			let color: number = this.whoseMove();
			let moves: number[] = [];
			for (let i: number = 0; i < 64 && moves.length == 0; i++)
				if (this.Squares[i] | color)
					this.getLegalMoves(i, moves);
			return moves.length == 0;
		}

	whoseMove(): number
		{
			return ((this.Moves.length % 2) == 0) ? White : Black;
		}
}
