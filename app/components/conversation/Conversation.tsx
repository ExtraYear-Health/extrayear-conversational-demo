'use client';

import { InitialScreen } from './InitialScreen';
import { Chat } from './Chat/Chat';
import { EndScreen } from './EndScreen';
import { ConversationProvider, ConversationState, useConversation } from './context';

import { useVapi } from '@/app/lib/vapi/useVapi';
import { CallStatus } from '@/app/lib/conversation.type';
import { envConfig } from '@/app/config/envConfig.client';

function Conversation() {
  const { assistantId, state, setState } = useConversation();

  const { start, callStatus, transcripts = [], stop, isAssistantSpeeching, audioLevel } = useVapi({
    assistantId,
    onCallStarted(_call) {
      setState(ConversationState.STARTED);
    },
    onCallEnded() {
      setState(ConversationState.ENDED);
    },
  });

  switch (state) {
    case ConversationState.IDLE:
      return (
        <InitialScreen
          isLoading={callStatus === CallStatus.LOADING}
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
          isAssistantSpeeching={isAssistantSpeeching}
          audioLevel={audioLevel}
          onEndCall={() => {
            stop();
          }}
        />
      );
    case ConversationState.ENDED:
      return <EndScreen />;
    default:
      return null;
  }
}

function ConversationContextAware() {
  return (
    <ConversationProvider>
      <Conversation />
    </ConversationProvider>
  );
}

export { ConversationContextAware as Conversation };
