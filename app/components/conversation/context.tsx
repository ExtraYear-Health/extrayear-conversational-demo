'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { Activity } from '@/types';

export enum ConversationState {
  IDLE = 'idle',
  INTRO = 'intro',
  STARTED = 'started',
  ENDED = 'ended',
}

export type ConversationContext = {
  activity?: Activity;
  activityId?: string;
  setActivityId?: (activityId: string) => void;
  setState?: (state: ConversationState) => void;
  state: ConversationState;
  visualItems?: string[];
  setVisualItems?: (items: string[]) => void;
  activities?: Activity[];
};

const initialState = ConversationState.IDLE;

const ConversationContext = createContext<ConversationContext>({
  state: initialState,
});

interface ConversationProviderProps {
  activities?: ConversationContext['activities'];
  children?: ReactNode;
}

const ConversationProvider = ({ children, activities }: ConversationProviderProps) => {
  const [state, setState] = useState<ConversationState>(initialState);

  const [activityId, setActivityId] = useState<string>();

  const activity = useMemo(() => {
    return activities?.find(({ id }) => id === activityId);
  }, [activityId]);

  const [visualItems, setVisualItems] = useState<string[]>();

  return (
    <ConversationContext.Provider
      value={{
        activities,
        activity,
        activityId,
        setActivityId,
        setState,
        setVisualItems,
        state,
        visualItems,
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
