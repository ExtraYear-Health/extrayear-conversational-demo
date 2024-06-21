'use client';

import { envConfig } from '@/config/envConfig.client';
import { CallStatus } from '@/lib/conversation.type';
import { useVapi } from '@/lib/vapi/useVapi';

import { Chat } from './Chat/Chat';
import { ConversationState, useConversation } from './context';
import { EndScreen } from './EndScreen';
import { InitialScreen } from './InitialScreen';

export function Conversation() {
  const { activityId, state, setState, setVisualItems } = useConversation();

  const {
    start,
    callStatus,
    transcripts = [],
    stop,
    isAssistantSpeeching,
    audioLevel,
  } = useVapi({
    assistantId: activityId,
    onCallStarted(_call) {
      setState(ConversationState.STARTED);
    },
    onCallEnded() {
      setState(ConversationState.ENDED);
    },
    onDisplayItems(message) {
      const items = message.functionCall.parameters.items;
      if (items) {
        setVisualItems(items.split(','));
      }
    },
    onHideItems() {
      setVisualItems([]);
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
            if (envConfig.enableMockups) {
              setState(ConversationState.ENDED);
            } else {
              stop();
            }
          }}
        />
      );
    case ConversationState.ENDED:
      return <EndScreen />;
    default:
      return null;
  }
}
