# Chess Game

A web-based chess game built with Next.js, React, and chess.js that lets you play against an AI opponent or another player.

## Features

- Full chess game with all standard rules
- Play against AI with three difficulty levels
- Switch sides with the computer
- Visual indication of available moves
- Board flipping
- New game functionality
- Responsive design

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

2. Install the dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to play the game.

## How to Play

### Against Computer
- Computer plays as black by default
- Click "Computer: Black" to switch sides
- Change AI difficulty by clicking the difficulty button (Easy, Medium, Hard)
- Turn AI on/off with the toggle button

### Game Controls
- Click on a piece to select it
- Valid moves will be highlighted
- Click on a highlighted square to move the selected piece
- Use the "New Game" button to reset the board
- Use the "Flip Board" button to change perspective

## AI Difficulty Levels

- **Easy**: Makes random moves
- **Medium**: Makes a mix of best moves and random moves
- **Hard**: Uses a deeper minimax search to find better moves

## Deployment

This project can be easily deployed on Vercel:

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and create a new project
3. Import your GitHub repository
4. Deploy

## Technologies Used

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [chess.js](https://github.com/jhlywa/chess.js)
- [Tailwind CSS](https://tailwindcss.com/)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 