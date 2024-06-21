import classNames from 'classnames';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import 'react-toastify/dist/ReactToastify.css';

import { ToastContextProvider } from './context/Toast';
import './globals.css';
import { Providers } from './providers';

const ppmori = localFont({
  variable: '--font-pp-mori',
  src: [
    { path: './fonts/PPMori-Extralight.otf', weight: '300', style: 'normal' },
    { path: './fonts/PPMori-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/PPMori-SemiBold.otf', weight: '600', style: 'normal' },
    { path: './fonts/PPMori-ExtralightItalic.otf', weight: '300', style: 'italic' },
    { path: './fonts/PPMori-RegularItalic.otf', weight: '400', style: 'italic' },
    { path: './fonts/PPMori-SemiBoldItalic.otf', weight: '600', style: 'italic' },
  ],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-dvh">
      <body className={`min-h-full light ${classNames(ppmori.className)}`}>
        <Providers>
          <ToastContextProvider>{children}</ToastContextProvider>
        </Providers>
      </body>
    </html>
  );
}
