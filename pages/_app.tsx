import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SocketProvider } from '../contexts/SocketContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  );
}

export default MyApp; 