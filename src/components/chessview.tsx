import * as React from "react";
import * as Chess from "../chess";
import * as ChessControl from "../chesscontrol";

export interface ChessProps {
	chessControl: ChessControl.ChessControl
}

export interface ChessState { }

function getPieceClass(color: number, piece: number): string
	{
		if (piece == Chess.Empty) return "";

		let s: string = color == Chess.Black ? "blackPiece Black" : "whitePiece White";
		switch (piece)
		{
			case Chess.Empty: break;
			case Chess.Pawn: s += "Pawn"; break;
			case Chess.Knight: s += "Knight"; break;
			case Chess.Bishop: s += "Bishop"; break;
			case Chess.Rook: s += "Rook"; break;
			case Chess.Queen: s += "Queen"; break;
			case Chess.King: s += "King"; break;
		}
		return s;
	}

export class ChessView extends React.Component<ChessProps, ChessState> {
	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
		}

	handleClick(e: any): boolean
		{
			this.props.chessControl.clickSquare(Number(e.currentTarget.id));
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let chess: Chess.Chess = this.props.chessControl.chess;
			let nRows: number = 8;
			let nCells: number = 8;
			let rows: any[] = [];
			let c: number = 0;
			for (let i: number = 0; i < nRows; i++)
			{
				let row: any[] = [];
				for (let j: number = 0; j < nCells; j++, c++)
				{
					let piece: number = chess.pieceAt(c);
					let color: number = chess.colorAt(c);
					let pieceClass: string = getPieceClass(color, piece);
					let squareClass: string = (i % 2) == (j % 2) ? "whiteCell" : "blackCell";
					let selClass: string = chess.selected == c ? " selected" : "";
					let targetClass: string = chess.isTargeted(c) ? " targeted" : "";
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
