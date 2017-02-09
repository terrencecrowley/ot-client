import * as React from "react";
import * as Board from "../board";

export interface BoardProps {
	board: Board.Board,
	clickSquare: (id: number) => void
}

export interface BoardState { }

let PieceString: string[] = [];

function getPieceString(): string[]
	{
		if (PieceString.length == 0)
		{
			PieceString[Board.Empty] = "";
			PieceString[Board.Pawn] = "P";
			PieceString[Board.Knight] = "N";
			PieceString[Board.Bishop] = "B";
			PieceString[Board.Rook] = "R";
			PieceString[Board.Queen] = "Q";
			PieceString[Board.King] = "K";
		}
		return PieceString;
	}

export class BoardView extends React.Component<BoardProps, BoardState> {
	constructor(props: any)
		{
			super(props);
			this.handleClick = this.handleClick.bind(this);
		}

	handleClick(e: any): boolean
		{
			this.props.clickSquare(Number(e.currentTarget.id));
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

	render()
		{
			let nRows: number = 8;
			let nCells: number = 8;
			let rows: any[] = [];
			let c: number = 0;
			for (let i: number = 0; i < nRows; i++)
			{
				let row: any[] = [];
				for (let j: number = 0; j < nCells; j++, c++)
				{
					let piece: number = this.props.board.pieceAt(c);
					let color: number = this.props.board.colorAt(c);
					let pieceClass: string = (color == Board.White) ? "whitePiece" : "blackPiece";
					let squareClass: string = (i % 2) == (j % 2) ? "whiteCell" : "blackCell";
					let selClass: string = this.props.board.selected == c ? " selected" : "";
					let targetClass: string = this.props.board.isTargeted(c) ? " targeted" : "";
					let classString: string = pieceClass + " " + squareClass;
					let pieceString = getPieceString()[piece];
					row[j] = (
						<div onClick={this.handleClick} id={String(c)} key={String(c)} className={classString}>
							<table className="pieceTable"><tbody><tr><td className={selClass + targetClass}>&nbsp;{pieceString}&nbsp;</td></tr></tbody></table>
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
