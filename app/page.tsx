'use client';

import Image from 'next/image';
import GitHubButton from 'react-github-btn';

export const runtime = 'edge';
// import { init } from "@fullstory/browser";
import { useEffect } from 'react';
import { XIcon } from './components/icons/XIcon';
import { FacebookIcon } from './components/icons/FacebookIcon';
import { LinkedInIcon } from './components/icons/LinkedInIcon';
import Conversation from './components/Conversation';

export default function Home() {
  // useEffect(() => {
  //   init({ orgId: "5HWAN" });
  // }, []);

  return (
    <main className="h-full overflow-hidden">
      <Conversation />
    </main>
  );
}
