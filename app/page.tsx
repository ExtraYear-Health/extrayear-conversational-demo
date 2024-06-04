'use client';

export const runtime = 'edge';

import { NextUIProvider } from '@nextui-org/react';

import { Conversation } from './components/conversation/Conversation';

export default function Home() {
  return (
    <NextUIProvider className="h-full">
      <main className="h-full overflow-hidden">
        <Conversation />
      </main>
    </NextUIProvider>
  );
}
