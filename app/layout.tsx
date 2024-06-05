import { Inter } from 'next/font/google';
import classNames from 'classnames';
import localFont from 'next/font/local';
import type { Metadata, Viewport } from 'next';

import { Providers } from './providers';
import { ToastContextProvider } from './context/Toast';

import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const favorit = localFont({
  src: './fonts/ABCFavorit-Bold.woff2',
  variable: '--font-favorit',
});

export const viewport: Viewport = {
  themeColor: '#000000',
  initialScale: 1,
  width: 'device-width',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://extrayear.ai'),
  title: 'ExtraYear Cognitive Rehab',
  description: `ExtraYear showcases digital cognitive rehab powered by AI.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh">
      <body
        className={`h-full dark ${classNames(
          favorit.variable,
          inter.className,
        )}`}
      >
        <Providers>
          <ToastContextProvider>
            {children}
          </ToastContextProvider>
        </Providers>
      </body>
    </html>
  );
}
