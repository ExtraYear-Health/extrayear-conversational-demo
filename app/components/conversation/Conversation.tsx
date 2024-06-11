'use client';

import { envConfig } from '@/config/envConfig.client';
import { CallStatus } from '@/lib/conversation.type';
import { useVapi } from '@/lib/vapi/useVapi';

import { Chat } from './Chat/Chat';
import { ConversationProvider, ConversationState, useConversation } from './context';
import { EndScreen } from './EndScreen';
import { InitialScreen } from './InitialScreen';

function Conversation() {
  const { assistantId, state, setState } = useConversation();

  const {
    start,
    callStatus,
    transcripts = [],
    stop,
    isAssistantSpeeching,
    audioLevel,
  } = useVapi({
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
