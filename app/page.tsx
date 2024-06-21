'use server';

import { getActivities } from '@/services/getActivities';

import { ConversationProvider } from './components/conversation/context';
import { Conversation } from './components/conversation/Conversation';

export default async function Home() {
  const activities = await getActivities();

  return (
    <ConversationProvider activities={activities}>
      <Conversation />
    </ConversationProvider>
  );
}
