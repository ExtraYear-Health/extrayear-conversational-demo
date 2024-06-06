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

  const { start, callStatus, transcripts = [], stop, isAssistantSpeeching } = useVapi({
    assistantId,
    onCallStarted(_call) {
      setState(ConversationState.STARTED);
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

function ConversationContextAware() {
  return (
    <ConversationProvider>
      <Conversation />
    </ConversationProvider>
  );
}

export { ConversationContextAware as Conversation };
