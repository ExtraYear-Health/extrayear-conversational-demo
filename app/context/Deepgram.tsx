"use client";

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveSchema,
  LiveTranscriptionEvents,
  SpeakSchema,
  createClient,
} from "@deepgram/sdk";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useReducer,
  Dispatch,
  useState,
} from "react";
import { useToast } from "./Toast";
import { voices, voiceMap } from "./Voices";
import { llmModels, llmModelMap, LLMModelConfig } from "../context/LLM";
import { promptData, PromptConfig, getPromptConfig } from "./PromptList";

type DeepgramAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION'; payload: LiveClient | null }
  | { type: 'RESET_CONNECTION' }
  | { type: 'SET_CONNECTION_READY'; payload: boolean }
  | { type: 'SET_TTS_OPTIONS'; payload: SpeakSchema | undefined }
  | { type: 'SET_STT_OPTIONS'; payload: LiveSchema | undefined }
  | { type: 'SET_LLM_LATENCY'; payload: { start: number; response: number } }
  | { type: 'SET_API_KEY'; payload: string | undefined}
  | { type: 'SET_LLM'; payload: string | undefined}
  | { type: 'SET_PROMPT'; payload: string | undefined}
  | { type: 'API_KEY_ERROR'; payload: Error }
  | { type: 'SET_LOADING_KEY'; payload: boolean };

// State Type
type DeepgramState = {
  apiKey?: string;
  apiKeyError?: Error;
  ttsOptions: SpeakSchema | undefined;
  sttOptions: LiveSchema | undefined;
  connection: LiveClient | null;
  connecting: boolean;
  connectionReady: boolean;
  llmLatency?: { start: number; response: number };
  isLoadingKey: boolean;
  llm?: LLMModelConfig | undefined;
  selectedPrompt?: PromptConfig | undefined; 
};

type DeepgramContext = {
  state: DeepgramState;
  dispatch: Dispatch<DeepgramAction>;
};

interface DeepgramContextInterface {
  children: React.ReactNode;
}

const initialState = {
  apiKey: undefined,             // Holds the API key string
  apiKeyError: undefined,        // Holds any error that occurs during API key retrieval
  isLoadingKey: true,
  ttsOptions: undefined,         // Text-to-Speech options
  sttOptions: undefined,         // Speech-to-Text options
  connection: null,              // Represents the LiveClient connection instance
  connecting: false,             // Indicates whether the connection process is ongoing
  connectionReady: false,        // Indicates whether the connection is established and ready
  llm: undefined,
  selectedPrompt: undefined,
};

const DeepgramContext = createContext<DeepgramContext>({ state: initialState, dispatch: () => undefined });

const getApiKey = async (): Promise<string> => {
  console.log('getting a new api key');
  const result: CreateProjectKeyResponse = await (
    await fetch("/api/authenticate", { cache: "no-store" })
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
      const voiceConfig = voices[action.payload.model]; //voices[action.payload.model];
      if (!voiceConfig) {
        console.error("Voice model not found:", action.payload.model);
        return state; // Optionally handle this error more gracefully
      }
      return {
        ...state,
        ttsOptions: {
          ...state.ttsOptions, // Preserve existing ttsOptions
          model: action.payload.model,
          //ttsProvider: action.payload.ttsProvider, // Use the provided ttsProvider from action payload
          ttsProvider: voiceConfig.ttsProvider, // Include ttsProvider from voice config
          voiceId: voiceConfig.voiceId,// Add other relevant voice settings here if needed
        }
      };
    case 'SET_STT_OPTIONS':
      return { ...state, sttOptions: action.payload };
    case 'SET_LLM_LATENCY':
      return { ...state, llmLatency: action.payload };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload, apiKeyError: undefined };
    case 'API_KEY_ERROR':
      return { ...state, apiKeyError: action.payload };
    case 'SET_LOADING_KEY':
      return { ...state, isLoadingKey: action.payload };
    case 'SET_PROMPT':
      const promptConfig = getPromptConfig(action.payload); // Use getPromptConfig to find the prompt
      if (!promptConfig) {
        console.error("Prompt not found:", action.payload);
        return state; // Optionally handle this error more gracefully
      }
      return { ...state, selectedPrompt: promptConfig }; // Set the found prompt config
    case 'SET_LLM':
      const llmConfig = llmModelMap(action.payload);
      if (!llmConfig) {
        console.error("LLM model not found:", action.payload);
        return state; // Optionally handle this error more gracefully
      }
      return {
        ...state,
        llm: llmConfig  // Directly set llm to the retrieved config object
      };
    default:
      return state;
  }
}

const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useRef(true);

  useEffect(() => {
     if (!state.apiKey) {
      console.log("getting a new api key"); //zero
      fetch("/api/authenticate", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          if (!("key" in object)) throw new Error("No api key returned");

          dispatch({ type: 'SET_API_KEY', payload: object.key });
          dispatch({ type: 'SET_LOADING_KEY', payload: false });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [state.apiKey]);

  useEffect(() => {
    if (state.apiKey) { // && "key" in apiKey
      console.log("connecting to deepgram"); //first
      const deepgram = createClient(state.apiKey);
      const connection = deepgram.listen.live({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 550,
        utterance_end_ms: 1500, //if changed, may need to change the value for the failsafe in Conversation.tsx as well.
        filler_words: true,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        dispatch({ type: 'SET_CONNECTION_READY', payload: true });
        console.log('connected');
      });
  
      connection.on(LiveTranscriptionEvents.Close, () => {
        toast("The connection to ExtraYear closed, we'll attempt to reconnect.");
        dispatch({ type: 'RESET_CONNECTION' });
        console.log('closed');
      });
  
      connection.on(LiveTranscriptionEvents.Error, () => {
        toast("An unknown error occurred. We'll attempt to reconnect to ExtraYear.");
        dispatch({ type: 'RESET_CONNECTION' });
      });

      dispatch({ type: 'SET_CONNECTION', payload: connection });
      dispatch({ type: 'SET_CONNECTING', payload: false });
  
      if (connection) {
          
        return () => {
          console.log('cleanup connection');
          dispatch({ type: 'RESET_CONNECTION' });
        };
      }

    }
  }, [state.apiKey]);

  useEffect(() => {
    return () => {
      console.log('isMounted false');
      isMounted.current = false;
    };
  }, []);

  //Set initial values for TTS, STT, and LLM
  useEffect(() => {
    if (!state.ttsOptions) {
      // dispatch({ type: 'SET_TTS_OPTIONS', payload: { model: "aura-asteria-en" } }); //deepgram TTS
      // dispatch({ type: 'SET_TTS_OPTIONS', payload: { model: "matilda-en" } }); //elevenlabs TTS
      dispatch({ type: 'SET_TTS_OPTIONS', payload: { model: "ava-en" } }); //azure TTS
    }
    if (!state.sttOptions) {
      dispatch({ type: 'SET_STT_OPTIONS', payload: {
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 550, // Time in milliseconds of silence to wait for before finalizing speech
        // utterance_end_ms: 1500, sends utterance end object. doesn't seem to be enabled in this demo. requires interimResults to be true.
        filler_words: true, 
      }});
    }
    if (!state.llm){
      console.log('set llm');
      dispatch({ type: 'SET_LLM', payload: "groq-llama3-8b"});
    }
  }, [state.connection, state.sttOptions, state.ttsOptions, state.llm, state.selectedPrompt]);//[connect, state.connection, state.sttOptions, state.ttsOptions]);

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

