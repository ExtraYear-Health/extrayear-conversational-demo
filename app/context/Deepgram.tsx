'use client';

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveSchema,
  LiveTranscriptionEvents,
  SpeakSchema,
  createClient,
} from '@deepgram/sdk';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useReducer,
  Dispatch,
} from 'react';

import { llmModelMap, LLMModelConfig } from '../context/LLM';

import { useToast } from './Toast';
import { voices, voiceMap } from './Voices';

type DeepgramAction =
  | { type: 'SET_CONNECTING'; payload: boolean; }
  | { type: 'SET_CONNECTION'; payload: LiveClient | null; }
  | { type: 'RESET_CONNECTION'; }
  | { type: 'SET_CONNECTION_READY'; payload: boolean; }
  | { type: 'SET_TTS_OPTIONS'; payload: SpeakSchema | undefined; }
  | { type: 'SET_STT_OPTIONS'; payload: LiveSchema | undefined; }
  | { type: 'SET_UTTERANCE_END_MS'; payload: number; }
  | { type: 'SET_VAD_VOICE_PROB_THRESHOLD'; payload: number; }
  | { type: 'SET_LLM_LATENCY'; payload: { start: number; response: number; }; }
  | { type: 'SET_API_KEY'; payload: string | undefined; }
  | { type: 'SET_LLM'; payload: string | undefined; }
  | { type: 'SET_PROMPT'; payload: string | undefined; }
  | { type: 'API_KEY_ERROR'; payload: Error; }
  | { type: 'SET_LOADING_KEY'; payload: boolean; };

// State Type
type DeepgramState = {
  apiKey?: string;
  apiKeyError?: Error;
  ttsOptions: SpeakSchema | undefined;
  sttOptions: LiveSchema | undefined;
  connection: LiveClient | null;
  connecting: boolean;
  connectionReady: boolean;
  llmLatency?: { start: number; response: number; };
  isLoadingKey: boolean;
  llm?: LLMModelConfig | undefined;
  selectedPromptId?: string;
  vadOptions?: {
    voiceProbThreshold?: number;
  };
};

type DeepgramContext = {
  state: DeepgramState;
  dispatch: Dispatch<DeepgramAction>;
};

interface DeepgramContextInterface {
  children: React.ReactNode;
}

const initialState: DeepgramState = {
  apiKey: undefined, // Holds the API key string
  apiKeyError: undefined, // Holds any error that occurs during API key retrieval
  isLoadingKey: true,
  connection: null, // Represents the LiveClient connection instance
  connecting: false, // Indicates whether the connection process is ongoing
  connectionReady: false, // Indicates whether the connection is established and ready

  // Language Model options
  llm: llmModelMap('openai-gpt4o'),
  selectedPromptId: 'londonMarathonArticleConversation',

  // Text-to-Speech options
  ttsOptions: {
    model: 'ava-en',
    ttsProvider: voices['ava-en'].ttsProvider,
    voiceId: voices['ava-en'].voiceId,
  },

  // Speech-to-Text options
  sttOptions: {
    model: 'nova-2',
    interim_results: true,
    smart_format: true,
    endpointing: 10,
    utterance_end_ms: 4000,
    filler_words: true,
  },

  // Voice Activity Detection options
  vadOptions: {
    voiceProbThreshold: 0.7,
  },
};

const DeepgramContext = createContext<DeepgramContext>({ state: initialState, dispatch: () => undefined });

const getApiKey = async (): Promise<string> => {
  console.log('getting a new api key');
  const result: CreateProjectKeyResponse = await (
    await fetch('/api/authenticate', { cache: 'no-store' })
  ).json();
  return result.key;
};

// Define the state reducer
function reducer(state: DeepgramState, action: DeepgramAction): DeepgramState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload };
    case 'SET_CONNECTION':
      return { ...state, connection: action.payload, connecting: false, connectionReady: !!action.payload };
    case 'RESET_CONNECTION':
      return { ...state, connection: null, connectionReady: false, connecting: false, apiKey: undefined, isLoadingKey: true };
    case 'SET_CONNECTION_READY':
      return { ...state, connectionReady: action.payload };
    case 'SET_TTS_OPTIONS':
      const voiceConfig = voices[action.payload.model]; // voices[action.payload.model];
      if (!voiceConfig) {
        console.error('Voice model not found:', action.payload.model);
        return state; // Optionally handle this error more gracefully
      }
      return {
        ...state,
        ttsOptions: {
          ...state.ttsOptions, // Preserve existing ttsOptions
          model: action.payload.model,
          ttsProvider: voiceConfig.ttsProvider, // Include ttsProvider from voice config
          voiceId: voiceConfig.voiceId, // Add other relevant voice settings here if needed
        },
      };
    case 'SET_STT_OPTIONS':
      return { ...state, sttOptions: action.payload };
    case 'SET_UTTERANCE_END_MS': // New case for updating utterance_end_ms
      return {
        ...state,
        sttOptions: state.sttOptions ?
          { ...state.sttOptions, utterance_end_ms: action.payload } :
          { utterance_end_ms: action.payload },
      };
    case 'SET_VAD_VOICE_PROB_THRESHOLD':
      return {
        ...state,
        vadOptions: {
          ...state.vadOptions,
          voiceProbThreshold: action.payload,
        },
      };
    case 'SET_LLM_LATENCY':
      return { ...state, llmLatency: action.payload };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload, apiKeyError: undefined };
    case 'API_KEY_ERROR':
      return { ...state, apiKeyError: action.payload };
    case 'SET_LOADING_KEY':
      return { ...state, isLoadingKey: action.payload };
    case 'SET_PROMPT':
      return { ...state, selectedPromptId: action.payload };
    case 'SET_LLM':
      const llmConfig = llmModelMap(action.payload);
      if (!llmConfig) {
        console.error('LLM model not found:', action.payload);
        return state; // Optionally handle this error more gracefully
      }
      return {
        ...state,
        llm: llmConfig, // Directly set llm to the retrieved config object
      };
    default:
      return state;
  }
}

const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useRef(true);

  // Event listener references
  const onOpen = useRef((() => {
    dispatch({ type: 'SET_CONNECTION_READY', payload: true });
    console.log('connected with new sttOptions');
  })).current;

  const onClose = useRef((() => {
    toast('The connection to ExtraYear closed, we\'ll attempt to reconnect.');
    dispatch({ type: 'RESET_CONNECTION' });
    console.log('closed');
  })).current;

  const onError = useRef((() => {
    toast('An unknown error occurred. We\'ll attempt to reconnect to ExtraYear.');
    dispatch({ type: 'RESET_CONNECTION' });
  })).current;

  useEffect(() => {
    if (!state.apiKey) {
      console.log('getting a new api key'); // zero
      fetch('/api/authenticate', { cache: 'no-store' })
        .then((res) => res.json())
        .then((object) => {
          if (!('key' in object)) throw new Error('No api key returned');
          dispatch({ type: 'SET_API_KEY', payload: object.key });
          dispatch({ type: 'SET_LOADING_KEY', payload: false });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [state.apiKey]);

  useEffect(() => {
    const setupConnection = () => {
      console.log('connecting to deepgram with new settings');
      const deepgram = createClient(state.apiKey);
      const connection = deepgram.listen.live(state.sttOptions);

      connection.on(LiveTranscriptionEvents.Open, onOpen);
      connection.on(LiveTranscriptionEvents.Close, onClose);
      connection.on(LiveTranscriptionEvents.Error, onError);

      dispatch({ type: 'SET_CONNECTION', payload: connection });
    };

    if (state.apiKey && !state.connection) {
      setupConnection();
    }

    return () => {
      if (state.connection) {
        console.log('cleanup connection on component unmount');
        state.connection.off(LiveTranscriptionEvents.Open, onOpen);
        state.connection.off(LiveTranscriptionEvents.Close, onClose);
        state.connection.off(LiveTranscriptionEvents.Error, onError);
        dispatch({ type: 'RESET_CONNECTION' });
      }
    };
  }, [state.apiKey, state.sttOptions, toast, onClose, onError, onOpen, state.connection]);

  useEffect(() => {
    return () => {
      console.log('isMounted false');
      isMounted.current = false;
    };
  }, []);

  return (
    <DeepgramContext.Provider value={{ state, dispatch }}>
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  return useContext(DeepgramContext);
}

export { DeepgramContext, DeepgramContextProvider, useDeepgram, voiceMap, voices };
