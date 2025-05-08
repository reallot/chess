import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  makeMove: (gameId: string, move: any, gameState: string) => void;
  sendMessage: (gameId: string, message: string, sender: string) => void;
  gameOver: (gameId: string, result: string) => void;
  gameId: string | null;
  playerColor: 'w' | 'b' | null;
  opponentName: string | null;
  messages: Array<{ sender: string; message: string }>;
  error: string | null;
  isSpectator: boolean;
  connecting: boolean;
}

const defaultContext: SocketContextType = {
  socket: null,
  createGame: () => {},
  joinGame: () => {},
  makeMove: () => {},
  sendMessage: () => {},
  gameOver: () => {},
  gameId: null,
  playerColor: null,
  opponentName: null,
  messages: [],
  error: null,
  isSpectator: false,
  connecting: true,
};

const SocketContext = createContext<SocketContextType>(defaultContext);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: string; message: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(true);

  useEffect(() => {
    // Clear any previous errors
    setError(null);
    setConnecting(true);

    // Determine socket URL - default to the same origin
    const socketUrl = window.location.origin;
    console.log('Connecting to socket server at:', socketUrl);

    // Connect to the socket server with explicit path
    const socketIO = io(socketUrl, {
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second timeout
    });

    // Handle connection events
    socketIO.on('connect', () => {
      console.log('Connected to socket server with ID:', socketIO.id);
      setSocket(socketIO);
      setConnecting(false);
    });

    socketIO.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}. Please try again.`);
      setConnecting(false);
    });

    // Socket event listeners
    socketIO.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      setError(data.message);
    });

    socketIO.on('game_created', (data: { gameId: string; color: 'w' | 'b' }) => {
      console.log('Game created:', data);
      setGameId(data.gameId);
      setPlayerColor(data.color);
    });

    socketIO.on('game_joined', (data: { gameId: string; color: 'w' | 'b' }) => {
      console.log('Game joined:', data);
      setGameId(data.gameId);
      setPlayerColor(data.color);
      setIsSpectator(false);
    });

    socketIO.on('joined_as_spectator', (data: { gameId: string }) => {
      console.log('Joined as spectator:', data);
      setGameId(data.gameId);
      setIsSpectator(true);
    });

    socketIO.on('opponent_joined', (data: { opponentName: string }) => {
      console.log('Opponent joined:', data);
      setOpponentName(data.opponentName);
    });

    socketIO.on('message_received', (data: { sender: string; message: string }) => {
      setMessages(prev => [...prev, data]);
    });

    socketIO.on('player_disconnected', (data: { message: string }) => {
      console.log('Player disconnected:', data);
      setError(data.message);
    });

    return () => {
      console.log('Disconnecting socket');
      socketIO.disconnect();
    };
  }, []);

  // Socket action functions
  const createGame = (playerName: string) => {
    if (!socket) {
      setError('Socket not connected. Please try again.');
      return;
    }
    
    console.log('Creating game with name:', playerName);
    socket.emit('create_game', { playerName });
  };

  const joinGame = (gameId: string, playerName: string) => {
    if (!socket) {
      setError('Socket not connected. Please try again.');
      return;
    }
    
    console.log('Joining game:', gameId, 'with name:', playerName);
    socket.emit('join_game', { gameId, playerName });
  };

  const makeMove = (gameId: string, move: any, gameState: string) => {
    if (!socket) return;
    console.log('Making move in game:', gameId);
    socket.emit('make_move', { gameId, move, gameState });
  };

  const sendMessage = (gameId: string, message: string, sender: string) => {
    if (!socket) return;
    
    console.log('Sending message in game:', gameId);
    socket.emit('send_message', { gameId, message, sender });
    // Add own message to messages
    setMessages(prev => [...prev, { sender, message }]);
  };

  const gameOver = (gameId: string, result: string) => {
    if (!socket) return;
    
    console.log('Game over:', gameId, result);
    socket.emit('game_over', { gameId, result });
  };

  const value = {
    socket,
    createGame,
    joinGame,
    makeMove,
    sendMessage,
    gameOver,
    gameId,
    playerColor,
    opponentName,
    messages,
    error,
    isSpectator,
    connecting,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}; 