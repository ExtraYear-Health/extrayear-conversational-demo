'use client';

import { useState } from 'react';

import { InitialScreen } from './InitialScreen';
import { Chat } from './Chat';
import { EndScreen } from './EndScreen';

import { useVapi } from '@/app/lib/vapi/useVapi';
import { CallStatus } from '@/app/lib/conversation.type';

export enum ConversationState {
  IDLE = 'idle',
  STARTED = 'started',
  ENDED = 'ended',
}

const initialState = ConversationState.IDLE;

export function Conversation() {
  const [state, setState] = useState<ConversationState>(initialState);

  const { start, callStatus, transcripts = [], stop } = useVapi({
    onCallStarted(_call) {
      setState(ConversationState.STARTED);
    },
  });

  switch (state) {
    case ConversationState.IDLE:
      return (
        <InitialScreen
          onSubmit={start}
          isLoading={callStatus === CallStatus.LOADING}
        />
      );
    case ConversationState.STARTED:
      return (
        <Chat
          transcripts={transcripts}
          onEndCall={() => {
            stop();
            setState(ConversationState.ENDED);
          }}
        />
      );
    case ConversationState.ENDED:
      return <EndScreen />;
    default:
      return null;
  }
}
