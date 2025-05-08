import React, { useState, useEffect } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import Square from './Square';

interface ChessBoardProps {
  width?: string;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ width = '100%' }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  useEffect(() => {
    // Initialize a new game
    const newGame = new Chess();
    setGame(newGame);
  }, []);

  const handleSquareClick = (square: string) => {
    // If a square is already selected, try to make a move
    if (selectedSquare) {
      try {
        const move = game.move({
          from: selectedSquare as ChessSquare,
          to: square as ChessSquare,
          promotion: 'q', // Always promote to queen for simplicity
        });

        if (move) {
          // Move was successful
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      } catch (e) {
        // Invalid move, fall through to selecting a new square
      }
    }

    // Check if the clicked square has a piece that can move
    const piece = game.get(square as ChessSquare);
    if (piece && piece.color === (game.turn() === 'w' ? 'w' : 'b')) {
      setSelectedSquare(square);
      
      // Get valid moves for this piece
      const moves = game.moves({ square: square as ChessSquare, verbose: true });
      setValidMoves(moves.map(move => move.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  // Generate the squares of the board
  const renderBoard = () => {
    const squares = [];
    const ranks = boardOrientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = boardOrientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const file = files[fileIndex];
        const rank = ranks[rankIndex];
        const square = `${file}${rank}`;
        const isLight = (fileIndex + rankIndex) % 2 === 0;
        const piece = game.get(square as ChessSquare);

        squares.push(
          <Square
            key={square}
            square={square}
            isLight={isLight}
            piece={piece ? `${piece.color}${piece.type}` : null}
            selected={selectedSquare === square}
            validMove={validMoves.includes(square)}
            onClick={() => handleSquareClick(square)}
          />
        );
      }
    }

    return squares;
  };

  return (
    <div className="flex flex-col items-center mt-5">
      <div className="mb-5 text-xl font-bold">
        {game.isCheckmate() 
          ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.` 
          : game.isDraw() 
          ? 'Game ended in a draw.' 
          : `${game.turn() === 'w' ? 'White' : 'Black'} to move`}
      </div>
      
      <div className="board" style={{ maxWidth: width }}>
        {renderBoard()}
      </div>
      
      <div className="flex gap-4 mt-5">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={resetGame}
        >
          New Game
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={flipBoard}
        >
          Flip Board
        </button>
      </div>
    </div>
  );
};

export default ChessBoard; 