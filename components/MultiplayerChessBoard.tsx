import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square as ChessSquare, Move } from 'chess.js';
import { useSocket } from '../contexts/SocketContext';
import Square from './Square';

interface MultiplayerChessBoardProps {
  width?: string;
}

const MultiplayerChessBoard: React.FC<MultiplayerChessBoardProps> = ({ width = '100%' }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState<string>('');
  const { makeMove, gameId, playerColor, gameOver, socket, isSpectator } = useSocket();

  // Set board orientation based on player color
  useEffect(() => {
    if (playerColor) {
      setBoardOrientation(playerColor === 'w' ? 'white' : 'black');
    }
  }, [playerColor]);

  // Listen for opponent moves
  useEffect(() => {
    if (!socket) return;

    const handleOpponentMove = (data: { move: Move; gameState: string }) => {
      try {
        // Create a new chess instance and load the game state
        const newGame = new Chess();
        if (data.gameState) {
          newGame.load(data.gameState);
        } else {
          // Fallback: Apply the move directly
          newGame.move(data.move);
        }
        
        setGame(newGame);
        updateGameStatus(newGame);
      } catch (error) {
        console.error('Error applying opponent move:', error);
      }
    };

    socket.on('move_made', handleOpponentMove);

    return () => {
      socket.off('move_made', handleOpponentMove);
    };
  }, [socket]);

  // Update game status
  const updateGameStatus = useCallback((currentGame: Chess) => {
    let status = '';

    if (currentGame.isCheckmate()) {
      status = `Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins.`;
      if (gameId) {
        gameOver(gameId, status);
      }
    } else if (currentGame.isDraw()) {
      status = 'Game ended in a draw.';
      if (gameId) {
        gameOver(gameId, 'draw');
      }
    } else if (currentGame.isCheck()) {
      status = `Check! ${currentGame.turn() === 'w' ? 'White' : 'Black'} to move.`;
    } else {
      status = `${currentGame.turn() === 'w' ? 'White' : 'Black'} to move.`;
    }

    setGameStatus(status);
  }, [gameId, gameOver]);

  // Handle square click
  const handleSquareClick = (square: string) => {
    // If we're a spectator or it's not our turn, don't allow moves
    if (isSpectator || (playerColor && game.turn() !== playerColor.charAt(0))) {
      return;
    }
    
    // If a square is already selected, try to make a move
    if (selectedSquare) {
      try {
        const moveObj = {
          from: selectedSquare as ChessSquare,
          to: square as ChessSquare,
          promotion: 'q', // Always promote to queen for simplicity
        };
        
        const move = game.move(moveObj);

        if (move) {
          // Move was successful
          setSelectedSquare(null);
          setValidMoves([]);
          
          // Send move to server
          if (gameId) {
            makeMove(gameId, move, game.fen());
          }
          
          updateGameStatus(game);
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
    // Only the white player (or host) can reset the game
    if (playerColor !== 'w' && !isSpectator) {
      return;
    }
    
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setValidMoves([]);
    updateGameStatus(newGame);
    
    // TODO: Implement game reset functionality on the server
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
    <div className="flex flex-col items-center">
      <div className="mb-3 text-xl font-bold">
        {gameStatus}
        {isSpectator && <span className="ml-2 text-sm text-gray-500">(Spectating)</span>}
        {playerColor && !isSpectator && game.turn() !== playerColor.charAt(0) && (
          <span className="ml-2 text-sm text-gray-500">(Waiting for opponent)</span>
        )}
      </div>
      
      <div className="board" style={{ maxWidth: width }}>
        {renderBoard()}
      </div>
      
      <div className="flex gap-4 mt-5">
        {(playerColor === 'w' || isSpectator) && (
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={resetGame}
            disabled={game.isGameOver()}
          >
            New Game
          </button>
        )}
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

export default MultiplayerChessBoard; 