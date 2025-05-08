import React, { useState, useEffect } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import Square from './Square';
import { findBestMove, makeRandomMove } from './ChessAI';

interface ChessBoardProps {
  width?: string;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ width = '100%' }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [vsComputer, setVsComputer] = useState<boolean>(true);
  const [computerColor, setComputerColor] = useState<'w' | 'b'>('b');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  useEffect(() => {
    // Initialize a new game
    const newGame = new Chess();
    setGame(newGame);
    
    // If computer is white, make a move
    if (vsComputer && computerColor === 'w') {
      makeComputerMove(newGame);
    }
  }, []);

  // Make AI move after player moves
  useEffect(() => {
    // Check if it's computer's turn and game is not over
    if (vsComputer && 
        game.turn() === computerColor && 
        !game.isGameOver() && 
        !isThinking) {
      // Add a small delay to make it feel more natural
      const timer = setTimeout(() => {
        makeComputerMove(game);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [game, vsComputer, computerColor, isThinking]);

  const makeComputerMove = (currentGame: Chess) => {
    setIsThinking(true);
    
    // Use setTimeout to prevent UI freeze during calculation
    setTimeout(() => {
      let move;
      
      // Select move based on difficulty
      switch (aiDifficulty) {
        case 'easy':
          move = makeRandomMove(currentGame);
          break;
        case 'medium':
          // 50% chance of best move, 50% chance of random move
          move = Math.random() > 0.5 
            ? findBestMove(currentGame, 2) 
            : makeRandomMove(currentGame);
          break;
        case 'hard':
          move = findBestMove(currentGame, 3);
          break;
      }
      
      // Make the move if one was found
      if (move) {
        const newGame = new Chess(currentGame.fen());
        newGame.move(move);
        setGame(newGame);
      }
      
      setIsThinking(false);
    }, 100);
  };

  const handleSquareClick = (square: string) => {
    // If it's computer's turn and vs computer mode is on, don't allow moves
    if (vsComputer && game.turn() === computerColor) {
      return;
    }
    
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
          
          // Update game state
          const newGame = new Chess(game.fen());
          setGame(newGame);
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
    
    // If computer is white, make a move
    if (vsComputer && computerColor === 'w') {
      makeComputerMove(newGame);
    }
  };

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  const toggleVsComputer = () => {
    setVsComputer(!vsComputer);
  };

  const switchSides = () => {
    const newColor = computerColor === 'w' ? 'b' : 'w';
    setComputerColor(newColor);
    
    // If switching to computer's turn, make a move
    if (game.turn() === newColor && !game.isGameOver()) {
      makeComputerMove(game);
    }
  };

  const changeDifficulty = () => {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(aiDifficulty);
    const nextDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
    setAiDifficulty(nextDifficulty);
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
      <div className="mb-3 text-xl font-bold">
        {game.isCheckmate() 
          ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.` 
          : game.isDraw() 
          ? 'Game ended in a draw.' 
          : isThinking
          ? 'Computer is thinking...'
          : `${game.turn() === 'w' ? 'White' : 'Black'} to move`}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span>Play vs Computer:</span>
          <button 
            className={`px-2 py-1 rounded ${vsComputer ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
            onClick={toggleVsComputer}
          >
            {vsComputer ? 'On' : 'Off'}
          </button>
        </div>
        
        {vsComputer && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
              onClick={switchSides}
            >
              {computerColor === 'b' ? 'Computer: Black' : 'Computer: White'}
            </button>
            
            <button 
              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              onClick={changeDifficulty}
            >
              Difficulty: {aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)}
            </button>
          </div>
        )}
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