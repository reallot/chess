import React from 'react';

interface SquareProps {
  square: string;
  isLight: boolean;
  piece: string | null;
  selected: boolean;
  validMove: boolean;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ 
  square, 
  isLight, 
  piece, 
  selected, 
  validMove, 
  onClick 
}) => {
  // Generate class names for the square
  const squareClasses = [
    'square',
    isLight ? 'square-light' : 'square-dark',
    selected ? 'square-selected' : '',
    validMove ? 'square-valid-move' : '',
  ].filter(Boolean).join(' ');

  // Map piece code to chess piece image
  const getPieceImage = (piece: string) => {
    const color = piece.charAt(0);
    const type = piece.charAt(1);
    
    const pieceMap: Record<string, string> = {
      'wp': '♙', // white pawn
      'wn': '♘', // white knight
      'wb': '♗', // white bishop
      'wr': '♖', // white rook
      'wq': '♕', // white queen
      'wk': '♔', // white king
      'bp': '♟', // black pawn
      'bn': '♞', // black knight
      'bb': '♝', // black bishop
      'br': '♜', // black rook
      'bq': '♛', // black queen
      'bk': '♚', // black king
    };
    
    return pieceMap[piece] || '';
  };

  return (
    <div className={squareClasses} onClick={onClick} data-square={square}>
      {piece && (
        <div className="piece text-4xl">
          {getPieceImage(piece)}
        </div>
      )}
    </div>
  );
};

export default Square; 