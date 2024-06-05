'use client';
import { NextUIProvider } from '@nextui-org/react';

export function Providers({ children }) {
  return (
    <NextUIProvider className="h-full">
      <main className="h-full overflow-hidden">
        {children}
      </main>
    </NextUIProvider>
  );
}
