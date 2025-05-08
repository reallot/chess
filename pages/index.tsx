import type { NextPage } from 'next';
import Head from 'next/head';
import ChessBoard from '../components/ChessBoard';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Chess Game - Play vs Computer</title>
        <meta name="description" content="Play chess against an AI with adjustable difficulty levels" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Chess Game</h1>
        <p className="text-center mb-6 text-gray-600">Play against the computer or a friend</p>
        <div className="flex justify-center">
          <ChessBoard width="600px" />
        </div>
      </main>

      <footer className="mt-16 text-center text-gray-500">
        <p>Created with Next.js and Chess.js</p>
      </footer>
    </div>
  );
};

export default Home; 