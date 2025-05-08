import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Chess Game - Play Online or vs AI</title>
        <meta name="description" content="Play chess against the computer or with friends online" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Chess Game</h1>
        <p className="text-center mb-10 text-gray-600">Play chess online against the computer or with friends</p>
        
        <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Play vs Computer</h2>
            <p className="mb-6 text-gray-600">
              Challenge our chess AI with multiple difficulty levels. Practice your skills and improve your game.
            </p>
            <ul className="mb-6 text-gray-600 list-disc pl-5">
              <li>Three difficulty levels</li>
              <li>Adjust settings anytime</li>
              <li>Play as white or black</li>
              <li>Visual move suggestions</li>
            </ul>
            <Link href="/ai" className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded text-center">
              Play vs AI
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold mb-4 text-green-600">Play with a Friend</h2>
            <p className="mb-6 text-gray-600">
              Create a game and invite a friend to play. Share the link and start playing immediately.
            </p>
            <ul className="mb-6 text-gray-600 list-disc pl-5">
              <li>Real-time multiplayer</li>
              <li>In-game chat</li>
              <li>Invite via shareable link</li>
              <li>Spectator mode</li>
            </ul>
            <Link href="/multiplayer" className="block w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded text-center">
              Play Online
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-16 text-center text-gray-500">
        <p>Created with Next.js and Chess.js</p>
      </footer>
    </div>
  );
};

export default Home; 