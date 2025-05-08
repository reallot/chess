import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import ChessBoard from '../components/ChessBoard';

const AIPage: NextPage = () => {
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Chess Game - Play vs AI</title>
        <meta name="description" content="Play chess against an AI with adjustable difficulty levels" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Play vs AI</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
        
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

export default AIPage; 