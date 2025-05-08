import { Chess, Move, Square, PieceType } from 'chess.js';

// Piece values for evaluation
const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,    // pawn
  n: 3,    // knight
  b: 3,    // bishop
  r: 5,    // rook
  q: 9,    // queen
  k: 100   // king
};

// Position evaluation function
export const evaluateBoard = (game: Chess): number => {
  // If game is over, return a high value
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -1000 : 1000;
  }
  
  if (game.isDraw()) {
    return 0;
  }

  let score = 0;
  
  // Loop through all squares on the board
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = (String.fromCharCode(97 + j) + (8 - i)) as Square;
      const piece = game.get(square);
      
      if (piece) {
        // Add or subtract based on piece color
        const value = PIECE_VALUES[piece.type];
        score += piece.color === 'w' ? value : -value;
      }
    }
  }
  
  return score;
};

// Find best move for AI using minimax with alpha-beta pruning
export const findBestMove = (game: Chess, depth: number = 3): Move | null => {
  const moves = game.moves({ verbose: true });
  let bestMove: Move | null = null;
  let bestScore = game.turn() === 'w' ? -Infinity : Infinity;
  
  // Try each possible move
  for (const move of moves) {
    const newGame = new Chess(game.fen());
    newGame.move(move);
    
    // Evaluate the position after the move
    const score = minimax(newGame, depth - 1, -Infinity, Infinity, game.turn() === 'w' ? false : true);
    
    // Update best move if this is better
    if (game.turn() === 'w' && score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (game.turn() === 'b' && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
};

// Minimax algorithm with alpha-beta pruning
const minimax = (
  game: Chess, 
  depth: number, 
  alpha: number, 
  beta: number,
  isMaximizingPlayer: boolean
): number => {
  // Base case: return evaluation if we've reached the maximum depth or game over
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }
  
  const moves = game.moves({ verbose: true });
  
  if (isMaximizingPlayer) {
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      
      const score = minimax(newGame, depth - 1, alpha, beta, false);
      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);
      
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }
    
    return bestScore;
  } else {
    let bestScore = Infinity;
    
    for (const move of moves) {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      
      const score = minimax(newGame, depth - 1, alpha, beta, true);
      bestScore = Math.min(score, bestScore);
      beta = Math.min(beta, bestScore);
      
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }
    
    return bestScore;
  }
};

// Function to make a random move (fallback or for easier difficulty)
export const makeRandomMove = (game: Chess): Move | null => {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}; 