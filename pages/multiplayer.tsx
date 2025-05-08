import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSocket } from '../contexts/SocketContext';
import MultiplayerChessBoard from '../components/MultiplayerChessBoard';

const MultiplayerPage: NextPage = () => {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string>('');
  const [joinGameId, setJoinGameId] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const { 
    createGame, 
    joinGame, 
    gameId, 
    playerColor, 
    opponentName, 
    messages, 
    error, 
    sendMessage,
    isSpectator
  } = useSocket();

  // Handle join game from URL
  useEffect(() => {
    const { id } = router.query;
    if (id && typeof id === 'string') {
      setJoinGameId(id);
    }
  }, [router.query]);

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      createGame(playerName.trim());
    }
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && joinGameId.trim()) {
      joinGame(joinGameId.trim(), playerName.trim());
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && gameId) {
      sendMessage(gameId, chatMessage.trim(), playerName);
      setChatMessage('');
    }
  };

  const copyGameLink = () => {
    const url = `${window.location.origin}/multiplayer?id=${gameId}`;
    navigator.clipboard.writeText(url);
    alert('Game link copied to clipboard!');
  };

  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Chess Game - Multiplayer</title>
        <meta name="description" content="Play chess online with your friends" />
      </Head>

      <main className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Chess Online</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!gameId ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
              <label htmlFor="playerName" className="block text-gray-700 mb-2">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Create a New Game</h2>
                <button
                  onClick={handleCreateGame}
                  disabled={!playerName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
                >
                  Create Game
                </button>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Join a Game</h2>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter game ID"
                  />
                  <button
                    onClick={handleJoinGame}
                    disabled={!playerName.trim() || !joinGameId.trim()}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
                  >
                    Join Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-gray-600">Game ID: <span className="font-bold">{gameId}</span></p>
                  <p className="text-gray-600">
                    You are playing as: <span className="font-bold">{isSpectator ? 'Spectator' : playerColor === 'w' ? 'White' : 'Black'}</span>
                  </p>
                  {opponentName && (
                    <p className="text-gray-600">
                      Opponent: <span className="font-bold">{opponentName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <button
                    onClick={copyGameLink}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                  >
                    Copy Game Link
                  </button>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="ml-2 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
                  >
                    {showChat ? 'Hide Chat' : 'Show Chat'}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <MultiplayerChessBoard />
                </div>
                
                {showChat && (
                  <div className="w-full md:w-64 bg-gray-100 rounded-lg p-4">
                    <h3 className="font-bold mb-2">Chat</h3>
                    <div className="h-80 overflow-y-auto mb-4 border bg-white p-2 rounded">
                      {messages.length === 0 ? (
                        <p className="text-gray-500 italic">No messages yet</p>
                      ) : (
                        messages.map((msg, index) => (
                          <div key={index} className="mb-2">
                            <span className="font-bold">{msg.sender}:</span> {msg.message}
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded"
                        placeholder="Type a message"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim()}
                        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-gray-500">
        <p>Created with Next.js and Socket.io</p>
      </footer>
    </div>
  );
};

export default MultiplayerPage; 