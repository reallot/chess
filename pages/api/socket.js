import { Server } from 'socket.io';

// Store game sessions (in-memory storage)
const games = {};
const userGameMap = {};

export default function SocketHandler(req, res) {
  // Check if socket.io server is already initialized
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up socket connection');
  
  // Set up Socket.IO server with more permissive configuration
  const io = new Server(res.socket.server, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Configure transport preferences and parameters
    transports: ['polling', 'websocket'],
    allowEIO3: true, // Allow Engine.IO 3 compatibility
    connectTimeout: 45000, // Longer timeout for connections
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8,
    // Polling-specific options
    polling: {
      extraHeaders: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  });
  
  // Store io instance on server
  res.socket.server.io = io;

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    console.log(`Transport used: ${socket.conn.transport.name}`);

    // Send welcome message to confirm connection
    socket.emit('welcome', { message: 'Connected to server' });

    // Create a new game
    socket.on('create_game', ({ playerName }) => {
      try {
        console.log(`Creating game for player: ${playerName}`);
        const gameId = Math.random().toString(36).substring(2, 8);
        
        games[gameId] = {
          id: gameId,
          players: [{ id: socket.id, name: playerName, color: 'w' }],
          gameState: null,
          spectators: [],
          createdAt: new Date()
        };
        
        userGameMap[socket.id] = gameId;
        
        socket.join(gameId);
        socket.emit('game_created', { gameId, color: 'w' });
        
        console.log(`Game created: ${gameId} by ${playerName}`);
      } catch (err) {
        console.error('Error creating game:', err);
        socket.emit('error', { message: 'Failed to create game. Please try again.' });
      }
    });

    // Join an existing game
    socket.on('join_game', ({ gameId, playerName }) => {
      try {
        console.log(`${playerName} attempting to join game: ${gameId}`);
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
      } catch (err) {
        console.error('Error joining game:', err);
        socket.emit('error', { message: 'Failed to join game. Please try again.' });
      }
    });

    // Heartbeat to keep connection alive
    socket.on('heartbeat', (callback) => {
      if (typeof callback === 'function') {
        callback({ status: 'alive', time: new Date().toISOString() });
      }
    });

    // Player makes a move
    socket.on('make_move', ({ gameId, move, gameState }) => {
      try {
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
      } catch (err) {
        console.error('Error processing move:', err);
        socket.emit('error', { message: 'Failed to process move. Please try again.' });
      }
    });

    // Player sends a chat message
    socket.on('send_message', ({ gameId, message, sender }) => {
      try {
        socket.to(gameId).emit('message_received', { message, sender });
        console.log(`Message sent in game ${gameId} by ${sender}`);
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });

    // Game ended
    socket.on('game_over', ({ gameId, result }) => {
      try {
        const game = games[gameId];
        
        if (game) {
          io.to(gameId).emit('game_ended', { result });
          console.log(`Game ${gameId} ended: ${result}`);
        }
      } catch (err) {
        console.error('Error processing game over:', err);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      try {
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
          
          delete userGameMap[socket.id];
        }
        
        console.log(`User disconnected: ${socket.id}`);
      } catch (err) {
        console.error('Error handling disconnect:', err);
      }
    });
  });

  // Implement lightweight cleanup for stale games
  setInterval(() => {
    const now = new Date();
    const staleGameIds = [];
    
    for (const [gameId, game] of Object.entries(games)) {
      // Remove games older than 4 hours
      if (now - new Date(game.createdAt) > 4 * 60 * 60 * 1000) {
        staleGameIds.push(gameId);
      }
    }
    
    staleGameIds.forEach(gameId => {
      delete games[gameId];
      console.log(`Cleaned up stale game: ${gameId}`);
    });
  }, 30 * 60 * 1000); // Run every 30 minutes

  console.log('Socket server started');
  res.end();
} 