import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  reconnect: () => void;
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
  reconnect: () => {},
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
  
  // Use ref to track socket instance for reconnection
  const socketRef = useRef<Socket | null>(null);

  // Function to establish socket connection
  const connectSocket = () => {
    // Clear any previous errors
    setError(null);
    setConnecting(true);

    // Get the origin URL
    const origin = window.location.origin;
    console.log('Connecting to socket server at:', origin);

    // Configure socket options
    const socketOptions = {
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      forceNew: true,
      query: { timestamp: Date.now() } // Prevent caching issues
    };

    // Connect to the socket server
    try {
      const socketIO = io(origin, socketOptions);
      socketRef.current = socketIO;
      
      // Define heartbeatInterval at this scope level so it's accessible in the cleanup function
      let heartbeatInterval: ReturnType<typeof setInterval>;

      // Handle connection events
      socketIO.on('connect', () => {
        console.log('Connected to socket server with ID:', socketIO.id);
        setSocket(socketIO);
        setConnecting(false);
        
        // Setup heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (socketIO.connected) {
            socketIO.emit('heartbeat', (response: any) => {
              console.log('Heartbeat response:', response);
            });
          }
        }, 20000);
        
        // Clear heartbeat on disconnect
        socketIO.on('disconnect', () => {
          clearInterval(heartbeatInterval);
        });
      });

      socketIO.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err);
        setError(`Connection error: ${err.message}. Please try again.`);
        setConnecting(false);
      });

      // Welcome message confirms successful connection
      socketIO.on('welcome', (data: any) => {
        console.log('Received welcome from server:', data);
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
        // Clear any previous errors
        setError(null);
      });

      socketIO.on('game_joined', (data: { gameId: string; color: 'w' | 'b' }) => {
        console.log('Game joined:', data);
        setGameId(data.gameId);
        setPlayerColor(data.color);
        setIsSpectator(false);
        // Clear any previous errors
        setError(null);
      });

      socketIO.on('joined_as_spectator', (data: { gameId: string }) => {
        console.log('Joined as spectator:', data);
        setGameId(data.gameId);
        setIsSpectator(true);
        // Clear any previous errors
        setError(null);
      });

      socketIO.on('opponent_joined', (data: { opponentName: string }) => {
        console.log('Opponent joined:', data);
        setOpponentName(data.opponentName);
      });

      socketIO.on('message_received', (data: { sender: string; message: string }) => {
        setMessages((prev: Array<{ sender: string; message: string }>) => [...prev, data]);
      });

      socketIO.on('player_disconnected', (data: { message: string }) => {
        console.log('Player disconnected:', data);
        setError(data.message);
      });

      return () => {
        console.log('Disconnecting socket');
        clearInterval(heartbeatInterval);
        socketIO.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError('Failed to initialize socket connection. Please refresh the page.');
      setConnecting(false);
      return () => {};
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const cleanup = connectSocket();
    return cleanup;
  }, []);

  // Function to manually reconnect
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    connectSocket();
  };

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
    setMessages((prev: Array<{ sender: string; message: string }>) => [...prev, { sender, message }]);
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
    reconnect,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}; 