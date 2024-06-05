'use client';

import { useState } from 'react';

import { InitialScreen } from './InitialScreen';
import { Chat } from './Chat/Chat';
import { EndScreen } from './EndScreen';

import { useVapi } from '@/app/lib/vapi/useVapi';
import { CallStatus } from '@/app/lib/conversation.type';
import { envConfig } from '@/app/config/envConfig.client';

export enum ConversationState {
  IDLE = 'idle',
  STARTED = 'started',
  ENDED = 'ended',
}

const initialState = ConversationState.IDLE;

export function Conversation() {
  const [state, setState] = useState<ConversationState>(initialState);

  const [assistantId, setAssistantId] = useState<string>();

  const { start, callStatus, transcripts = [], stop } = useVapi({
    assistantId,
    onCallStarted(_call) {
      setState(ConversationState.STARTED);
    },
  });

  switch (state) {
    case ConversationState.IDLE:
      return (
        <InitialScreen
          assistantId={assistantId}
          isLoading={callStatus === CallStatus.LOADING}
          onSelectAssistant={(id) => setAssistantId(id)}
          onSubmit={() => {
            if (envConfig.enableMockups) {
              setState(ConversationState.STARTED);
            } else {
              start();
            }
          }}
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
