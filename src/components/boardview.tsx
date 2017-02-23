import * as React from "react";
import * as Board from "../board";
import * as BC from "../boardcontrol";

export interface BoardProps {
	bc: BC.BoardControl
}

export interface BoardState { }

function getPieceClass(color: number, piece: number): string
	{
		if (piece == Board.Empty) return "";

		let s: string = color == Board.Black ? "blackPiece Black" : "whitePiece White";
		switch (piece)
		{
			case Board.Empty: break;
			case Board.Pawn: s += "Pawn"; break;
			case Board.Knight: s += "Knight"; break;
			case Board.Bishop: s += "Bishop"; break;
			case Board.Rook: s += "Rook"; break;
			case Board.Queen: s += "Queen"; break;
			case Board.King: s += "King"; break;
		}
		return s;
	}

export class BoardView extends React.Component<BoardProps, BoardState> {
	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
		}

	handleClick(e: any): boolean
		{
			this.props.bc.clickSquare(Number(e.currentTarget.id));
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let board: Board.Board = this.props.bc.board;
			let nRows: number = 8;
			let nCells: number = 8;
			let rows: any[] = [];
			let c: number = 0;
			for (let i: number = 0; i < nRows; i++)
			{
				let row: any[] = [];
				for (let j: number = 0; j < nCells; j++, c++)
				{
					let piece: number = board.pieceAt(c);
					let color: number = board.colorAt(c);
					let pieceClass: string = getPieceClass(color, piece);
					let squareClass: string = (i % 2) == (j % 2) ? "whiteCell" : "blackCell";
					let selClass: string = board.selected == c ? " selected" : "";
					let targetClass: string = board.isTargeted(c) ? " targeted" : "";
					let classString: string = pieceClass + " " + squareClass;
					row[j] = (
						<div onClick={this.handleClick} id={String(c)} key={String(c)} className={classString}>
							<table className="pieceTable"><tbody><tr><td className={selClass + targetClass}>&nbsp;</td></tr></tbody></table>
						</div>
						);
				}
				rows[i] = (
					<div className="row">
					{row}
					</div>
					);
			}

			return (
				<div className="column">
				{rows}
				</div>
				);
		}
}
