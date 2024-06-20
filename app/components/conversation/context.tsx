import { Assistant } from '@vapi-ai/web/dist/api';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { getAssistant } from './actions';

export enum ConversationState {
  IDLE = 'idle',
  STARTED = 'started',
  ENDED = 'ended',
}

export type ConversationContext = {
  assistant?: Assistant;
  assistantId?: string;
  setAssistantId?: (assistantId: string) => void;
  setState?: (state: ConversationState) => void;
  state: ConversationState;
  visualItems?: string[];
  setVisualItems?: (items: string[]) => void;
};

const initialState = ConversationState.IDLE;

const ConversationContext = createContext<ConversationContext>({
  state: initialState,
});

const ConversationProvider = ({ children }) => {
  const [state, setState] = useState<ConversationState>(initialState);

  const [assistantId, setAssistantId] = useState<string>();
  const [assistant, setAssistant] = useState<Assistant>();

  const [visualItems, setVisualItems] = useState<string[]>();

  useEffect(() => {
    if (assistantId) {
      getAssistant(assistantId)
        .then((assistant) => {
          setAssistant(assistant);
        })
        .catch((err) => {
          toast.error(err.message);
        });
    }
  }, [assistantId]);

  return (
    <ConversationContext.Provider
      value={{
        assistant,
        assistantId,
        visualItems,
        setAssistantId,
        setVisualItems,
        setState,
        state,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

function useConversation() {
  return useContext(ConversationContext);
}

export { useConversation, ConversationProvider };
