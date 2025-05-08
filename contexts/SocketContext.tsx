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

  useEffect(() => {
    // Connect to the socket server
    const socketIO = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketIO);

    // Socket event listeners
    socketIO.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketIO.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    socketIO.on('game_created', (data: { gameId: string; color: 'w' | 'b' }) => {
      setGameId(data.gameId);
      setPlayerColor(data.color);
    });

    socketIO.on('game_joined', (data: { gameId: string; color: 'w' | 'b' }) => {
      setGameId(data.gameId);
      setPlayerColor(data.color);
      setIsSpectator(false);
    });

    socketIO.on('joined_as_spectator', (data: { gameId: string }) => {
      setGameId(data.gameId);
      setIsSpectator(true);
    });

    socketIO.on('opponent_joined', (data: { opponentName: string }) => {
      setOpponentName(data.opponentName);
    });

    socketIO.on('message_received', (data: { sender: string; message: string }) => {
      setMessages(prev => [...prev, data]);
    });

    socketIO.on('player_disconnected', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socketIO.disconnect();
    };
  }, []);

  // Socket action functions
  const createGame = (playerName: string) => {
    if (socket) {
      socket.emit('create_game', { playerName });
    }
  };

  const joinGame = (gameId: string, playerName: string) => {
    if (socket) {
      socket.emit('join_game', { gameId, playerName });
    }
  };

  const makeMove = (gameId: string, move: any, gameState: string) => {
    if (socket) {
      socket.emit('make_move', { gameId, move, gameState });
    }
  };

  const sendMessage = (gameId: string, message: string, sender: string) => {
    if (socket) {
      socket.emit('send_message', { gameId, message, sender });
      // Add own message to messages
      setMessages(prev => [...prev, { sender, message }]);
    }
  };

  const gameOver = (gameId: string, result: string) => {
    if (socket) {
      socket.emit('game_over', { gameId, result });
    }
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
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}; 