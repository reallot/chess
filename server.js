const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Store game sessions
const games = {};
const userGameMap = {};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new game
    socket.on('create_game', ({ playerName }) => {
      const gameId = Math.random().toString(36).substring(2, 8);
      
      games[gameId] = {
        id: gameId,
        players: [{ id: socket.id, name: playerName, color: 'w' }],
        gameState: null,
        spectators: []
      };
      
      userGameMap[socket.id] = gameId;
      
      socket.join(gameId);
      socket.emit('game_created', { gameId, color: 'w' });
      
      console.log(`Game created: ${gameId} by ${playerName}`);
    });

    // Join an existing game
    socket.on('join_game', ({ gameId, playerName }) => {
      const game = games[gameId];
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (game.players.length >= 2) {
        // Add as spectator
        game.spectators.push({ id: socket.id, name: playerName });
        userGameMap[socket.id] = gameId;
        
        socket.join(gameId);
        socket.emit('joined_as_spectator', { gameId, gameState: game.gameState });
        io.to(gameId).emit('spectator_joined', { spectator: playerName });
        
        console.log(`Spectator ${playerName} joined game ${gameId}`);
        return;
      }
      
      // Add as second player
      game.players.push({ id: socket.id, name: playerName, color: 'b' });
      userGameMap[socket.id] = gameId;
      
      socket.join(gameId);
      socket.emit('game_joined', { gameId, color: 'b' });
      
      // Notify the first player that the game is ready
      io.to(game.players[0].id).emit('opponent_joined', { 
        opponentName: playerName
      });
      
      console.log(`Player ${playerName} joined game ${gameId}`);
    });

    // Player makes a move
    socket.on('make_move', ({ gameId, move, gameState }) => {
      const game = games[gameId];
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Update game state
      game.gameState = gameState;
      
      // Broadcast move to all players in the game except the sender
      socket.to(gameId).emit('move_made', { move, gameState });
      
      console.log(`Move made in game ${gameId}`);
    });

    // Player sends a chat message
    socket.on('send_message', ({ gameId, message, sender }) => {
      socket.to(gameId).emit('message_received', { message, sender });
    });

    // Game ended
    socket.on('game_over', ({ gameId, result }) => {
      const game = games[gameId];
      
      if (game) {
        io.to(gameId).emit('game_ended', { result });
        console.log(`Game ${gameId} ended: ${result}`);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      const gameId = userGameMap[socket.id];
      
      if (gameId && games[gameId]) {
        const game = games[gameId];
        
        // Check if the player was one of the main players
        const playerIndex = game.players.findIndex(player => player.id === socket.id);
        
        if (playerIndex !== -1) {
          // Notify other players that the game has been abandoned
          socket.to(gameId).emit('player_disconnected', { 
            message: `${game.players[playerIndex].name} has disconnected` 
          });
          
          console.log(`Player ${socket.id} disconnected from game ${gameId}`);
        } else {
          // Remove from spectators
          const spectatorIndex = game.spectators.findIndex(spec => spec.id === socket.id);
          if (spectatorIndex !== -1) {
            game.spectators.splice(spectatorIndex, 1);
          }
        }
        
        // Clean up empty games after some time
        if (game.players.length === 0 || (game.players.length === 1 && game.spectators.length === 0)) {
          setTimeout(() => {
            // Double-check if the game is still empty
            if (games[gameId] && 
                (games[gameId].players.length === 0 || 
                (games[gameId].players.length === 1 && games[gameId].spectators.length === 0))) {
              delete games[gameId];
              console.log(`Game ${gameId} deleted due to inactivity`);
            }
          }, 60000); // Wait for 1 minute before deleting
        }
        
        delete userGameMap[socket.id];
      }
      
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 