'use client';

import { NextUIProvider } from '@nextui-org/react';

export function Providers({ children }) {
  return <NextUIProvider className="min-h-screen relative">{children}</NextUIProvider>;
}
