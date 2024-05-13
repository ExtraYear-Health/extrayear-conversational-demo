'use client';

import {
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from '@deepgram/sdk';
import { Message, useChat } from 'ai/react';
import { useMicVAD } from '@ricky0123/vad-react';
import { useNowPlaying } from 'react-nowplaying';
import { useQueue } from '@uidotdev/usehooks';
import { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import Mustache from 'mustache';

import {
  contextualGreeting,
  generateRandomString,
  utteranceText,
  extractIntroContent,
  cleanString,
} from '../lib/helpers';
import { MessageMetadata } from '../lib/types';
import { systemContent } from '../lib/constants';
import { useDeepgram, voiceMap } from '../context/Deepgram';
import { useMessageData } from '../context/MessageMetadata';
import { useMicrophone } from '../context/Microphone';
import { useAudioStore } from '../context/AudioStore';
import { useMessageCheck } from '../context/MessageCheck';
import { llmModels, LLMModelConfig } from '../context/LLM';

import { LeftBubble } from './LeftBubble';
import { RightBubble } from './RightBubble';
import { Controls } from './Controls';
import { ChatBubble } from './ChatBubble';
import { Header } from './conversation/Header';
import { InitialLoad } from './InitialLoad';

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function Conversation() {
  const { state, dispatch } = useDeepgram();
  const { addAudio } = useAudioStore();
  const { player, stop: stopAudio, play: startAudio } = useNowPlaying();
  const { addMessageData } = useMessageData();

  const {
    microphoneOpen,
    queue: microphoneQueue,
    queueSize: microphoneQueueSize,
    firstBlob,
    removeBlob,
    stream,
    startMicrophone,
    stopMicrophone,
  } = useMicrophone();

  /**
   * Queues
   */
  const {
    add: addTranscriptPart,
    queue: transcriptParts,
    clear: clearTranscriptParts,
  } = useQueue<{ is_final: boolean; speech_final: boolean; text: string; }>([]);

  /**
   * Refs
   */
  const messageMarker = useRef<null | HTMLDivElement>(null);
  const activeAssistantResponse = useRef<boolean>(false);
  const activeUserResponse = useRef<boolean>(false);

  /**
   * State
   */
  const [isProcessing, setProcessing] = useState(false);

  const [initialLoad, setInitialLoad] = useState(true);

  const assistant = voiceMap(state.ttsOptions.model);

  const introContent = useMemo(() => {
    // Check if we need to process the prompt.
    if (state.selectedPrompt) {
      const promptString = state.selectedPrompt.text;

      // Validate the prompt string to ensure it's usable.
      if (!promptString || promptString.trim() === '') {
        console.log('prompt is null or empty');
        return null;
      }

      const extractedContent = extractIntroContent(promptString);
      return extractedContent;
    }
  }, [state.selectedPrompt]);

  const processingPrompt = !introContent; // assume processing is ongoing if introContent is not available

  // Defines a memoized function to request TTS audio using current TTS settings.
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      const start = Date.now();
      const model = state.ttsOptions?.model ?? 'aura-asteria-en'; // Default model fallback

      let res: Response | null = null;
      try {
        // Request audio generation based on the TTS provider set in the state
        if (state.ttsOptions?.ttsProvider === 'deepgram') {
          res = await fetch(`/api/speak?model=${model}`, {
            cache: 'no-store',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
          });
        } else if (state.ttsOptions?.ttsProvider === 'elevenlabs') {
          res = await fetch('/api/natural-speak', {
            cache: 'no-store',
            method: 'POST',
            body: JSON.stringify({ message: message, voiceId: state.ttsOptions?.voiceId }),
          });
        } else if (state.ttsOptions?.ttsProvider === 'azure') {
          res = await fetch('/api/azureSpeak', {
            cache: 'no-store',
            method: 'POST',
            body: JSON.stringify({ message: message, voiceId: state.ttsOptions?.voiceId }),
          });
        }

        // Check response validity and log any failures
        if (!res || !res.ok) {
          console.error('Failed to fetch:', state.ttsOptions?.ttsProvider, res?.statusText);
          return;
        }

        const blob = await res.blob();
        stopMicrophone();

        // Calculate the latency and play the received TTS audio
        const latency = Number(res.headers.get('X-DG-Latency')) ?? Date.now() - start;
        startAudio(blob, 'audio/mp3', message.id).then(() => {
          addAudio({
            id: message.id,
            blob,
            latency,
            networkLatency: Date.now() - start,
            model,
          });

          // Restart the microphone after audio ends if the player exists
          if (player) {
            player.onended = () => {
              activeAssistantResponse.current = false;
              clearTranscriptParts();
              startMicrophone();
            };
          } else {
            console.error('Player is undefined');
          }
        });
      } catch (error) {
        // Log and optionally handle errors more explicitly
        console.error('Error fetching audio:', error);
      }
    },
    // Dependencies for useCallback to ensure the function updates when necessary
    [state.ttsOptions, addAudio, startAudio, stopMicrophone, startMicrophone, player],
  );

  // An optional callback that will be called when the chat stream ends
  const onFinish = useCallback(
    (msg: any) => {
      msg.content = cleanString(msg.content); // hack way to remove excess characters before TTS.
      requestTtsAudio(msg);
    },
    [requestTtsAudio],
  );

  // An optional callback that will be called with the response from the API endpoint. Useful for throwing customized errors or logging
  const onResponse = useCallback((res: Response) => {
    (async () => {
      const start = Number(res.headers.get('x-llm-start'));
      const response = Number(res.headers.get('x-llm-response'));
      dispatch({ type: 'SET_LLM_LATENCY', payload: { start, response } });
    })();
  }, [dispatch]);

  const systemMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: 'system',
      content: systemContent,
    }),
    [],
  );

  // //Anthropic does not accept system messages
  // const userSystemMessage: Message = useMemo(
  //   () => ({
  //     id: 'AAAA',
  //     role: "user",
  //     content: systemContent,
  //   }),
  //   []
  // );

  const greetingMessage: Message = useMemo(() => {
    // Check if processing is not completed and return a default or null object
    if (processingPrompt) {
      return null; // or return some default state that indicates processing is ongoing
    }
    return {
      id: generateRandomString(7),
      role: 'assistant',
      content: Mustache.render(introContent, {
        assistant_name: assistant.name,
      }),
    };
  }, [assistant.name, introContent, processingPrompt]);

  const promptMessage: Message = useMemo(() => {
    // Check if processing is not completed and return a default or null object
    if (processingPrompt) {
      return null; // or return some default state that indicates processing is ongoing
    }

    let promptContent = null;
    if (state.llm.llmProvider === 'Anthropic') {
      promptContent = systemContent + ' ' + state.selectedPrompt.text;
    } else {
      promptContent = state.selectedPrompt.text;
    }

    // Return the actual prompt message object once processing is complete
    return {
      id: 'AAAB',
      role: 'user',
      content: promptContent, // Access text safely assuming state.selectedPrompt is defined
    };
  }, [state.selectedPrompt, processingPrompt]);

  // const promptMessage: Message = useMemo(() => ({
  //   id: 'AAAB',
  //   role: "user",
  //   content: state.selectedPrompt.text, //
  // }), [state.selectedPrompt]);

  // Define a state to hold the current API endpoint for the chat functionality.
  const [chatApi, setChatApi] = useState(state.llm?.api || '/api/brain');

  // This effect hook synchronizes the local chatApi state with changes in the global state.
  // It ensures that the chat component always uses the correct API endpoint if updates occur.
  useEffect(() => {
    const newApi = state.llm?.api || '/api/brain';
    if (chatApi !== newApi) {
      // Update the local state with the new API endpoint, triggering re-render of dependent components
      setChatApi(newApi);
    }
  }, [state.llm]);

  // Define an interface to structure the data for AI model parameters within the application
  interface BodyApiType {
    llmModel: string;
    temperature: number;
    maxTokens: number;
  }

  // Initialize state to store AI model configurations with default settings
  const [bodyApi, setBodyApi] = useState<BodyApiType>({
    llmModel: 'gpt-3.5-turbo-16k-0613',
    temperature: 1.0,
    maxTokens: 1024,
  });

  // Effect hook to synchronize bodyApi state with changes in the global state (state.llm)
  useEffect(() => {
    // Determine the model to use, defaulting to a specific model if not specified in the state
    const newApiModel = state.llm?.llmModel || 'gpt-3.5-turbo-16k-0613';

    // Update local state if the global model has changed
    if (bodyApi.llmModel !== newApiModel) {
      setBodyApi({
        llmModel: newApiModel,
        temperature: state.llm.settings.temperature,
        maxTokens: state.llm.settings.maxTokens,
      });
    }
  }, [state.llm]); // Dependency on state.llm ensures this runs only when the external state changes

  /**
   * AI SDK for the voicebot conversation
   */
  const {
    messages: chatMessages,
    append,
    handleInputChange,
    input,
    handleSubmit,
    isLoading: llmLoading,
  } = useChat({
    id: 'aura',
    api: chatApi,
    body: bodyApi,
    initialMessages: [systemMessage, promptMessage, greetingMessage], // anthropic does not work with system messages
    onFinish,
    onResponse,
  });

  const [currentUtterance, setCurrentUtterance] = useState<string>();
  const [failsafeTriggered, setFailsafeTriggered] = useState<boolean>(false);
  const failsafeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<string>();
  const eventListenerAdded = useRef<boolean>(false); // used to protect against multiple event listeners being added

  // Update the ref whenever currentUtterance changes
  useEffect(() => {
    currentUtteranceRef.current = currentUtterance;
  }, [currentUtterance]);

  const onVADMisfire = useCallback(() => {
    console.log('VAD Misfire. Disaster!');
  }, []);

  // Utility function to clear timeouts
  const clearFailsafeTimeout = () => {
    if (failsafeTimeoutRef.current) {
    // console.log('timeout cleared'); //debug
      clearTimeout(failsafeTimeoutRef.current);
      failsafeTimeoutRef.current = null;
      setFailsafeTriggered(false); // ensure that the failsafe is turned off if we are receiving transcripts
    }
  };

  const setupFailsafeTimeout = () => {
    const failsafeAction = () => {
      const utterance = currentUtteranceRef.current;
      if (utterance) {
        console.log('failsafe fires! pew pew!!');
        setFailsafeTriggered(true);
        appendUserSpeechMessage(utterance);
        clearTranscriptParts();
        setCurrentUtterance(undefined);
        currentUtteranceRef.current = undefined; // Reset the ref
      }
    };
    // Clear any existing timeout before setting a new one
    clearFailsafeTimeout();
    // Set the new failsafe timeout
    failsafeTimeoutRef.current = setTimeout(failsafeAction, 1500);
  };

  const onSpeechEnd = useCallback(() => {
    if (!microphoneOpen) return;
    // console.log('speech end'); //debug
    setupFailsafeTimeout();
  }, [microphoneOpen, setupFailsafeTimeout]);

  const onSpeechStart = useCallback(() => {
    if (!microphoneOpen) return;
    // console.log('speech start'); //debug
    activeUserResponse.current = true;
    clearFailsafeTimeout();
    setFailsafeTriggered(false);
    if (player && !player.ended) {
      stopAudio();
      console.log('Barging in! SHH!');
    }
  }, [microphoneOpen, player, stopAudio]);

  useMicVAD({
    startOnLoad: true,
    stream,
    onSpeechStart,
    onSpeechEnd,
    onVADMisfire,
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.6 - 0.15,
  });

  useEffect(() => {
    if (llmLoading) {
      return;
    };
    if (!state.llmLatency) return;

    // Remove extra characters from LLM response.
    // clean string is a hack way to remove extra characters from the LLM response.
    chatMessages[chatMessages.length - 1].content = cleanString(chatMessages[chatMessages.length - 1].content);

    const latestLlmMessage: MessageMetadata = {
      ...chatMessages[chatMessages.length - 1],
      ...state.llmLatency,
      end: Date.now(),
      ttsModel: state.ttsOptions?.model,
    };

    addMessageData(latestLlmMessage);
  }, [
    chatMessages,
    state.llmLatency, // Update dependency to use state from context
    llmLoading,
    addMessageData,
    state.ttsOptions?.model, // Update dependency to use state from context
  ]);

  /**
   * Contextual functions
   */
  const requestWelcomeAudio = useCallback(async () => {
    requestTtsAudio(greetingMessage);
  }, [greetingMessage, requestTtsAudio]);

  const startConversation = useCallback(() => {
    if (processingPrompt) return;
    if (!initialLoad) return;
    setInitialLoad(false);

    // add a stub message data with no latency
    const promptMetadata: MessageMetadata = {
      ...promptMessage,
      ttsModel: state.ttsOptions?.model,
    };

    // add a stub message data with no latency
    const welcomeMetadata: MessageMetadata = {
      ...greetingMessage,
      ttsModel: state.ttsOptions?.model,
    };
    addMessageData(promptMetadata);
    addMessageData(welcomeMetadata);

    // get welcome audio
    requestWelcomeAudio();
  }, [
    addMessageData,
    greetingMessage,
    promptMessage,
    initialLoad,
    requestWelcomeAudio,
    state.ttsOptions?.model,
  ]);

  const onTranscript = useCallback((data: LiveTranscriptionEvent) => {
    let content = utteranceText(data);
    // console.log('transcript', content); //debug

    if (content !== '' || data.speech_final) {
      addTranscriptPart({
        is_final: data.is_final as boolean,
        speech_final: data.speech_final as boolean,
        text: content,
      });
    }
  }, [addTranscriptPart]);

  useEffect(() => {
    const onOpen = () => {
      if (state.connectionReady && !eventListenerAdded.current) {
        state.connection?.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
        eventListenerAdded.current = true;
      }
    };

    if (state.connection) {
      state.connection.addListener(LiveTranscriptionEvents.Open, onOpen);
      return () => {
        state.connection?.removeListener(LiveTranscriptionEvents.Open, onOpen);
        if (state.connectionReady && eventListenerAdded.current) {
          state.connection?.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
          eventListenerAdded.current = false;
        }
      };
    }
  }, [state.connection, state.connectionReady, onTranscript]);

  const getCurrentUtterance = useCallback(() => {
    const filteredParts = transcriptParts.filter(({ is_final, speech_final }, i, arr) => {
      return is_final || speech_final || (!is_final && i === arr.length - 1);
    });
    // console.log('filter parts', filteredParts); //debug
    return filteredParts; // Return the result as before
  }, [transcriptParts]);

  const [lastUtterance, setLastUtterance] = useState<number>();
  const lastContentRef = useRef<string>(null);

  // Append user-generated content to the chat.
  const appendUserSpeechMessage = (inputString) => {
    if (activeUserResponse.current) {
      console.log('append user message');
      stopMicrophone(); // stop the microphone now. The microphone will start again after TTS plays.
      activeAssistantResponse.current = true; // appending the user message automatically starts the LLM response.
      activeUserResponse.current = false; // this flag prevents another message being appended until onSpeechStart runs again.
      append({
        role: 'user',
        content: inputString,
      });
    }
  };

  useEffect(() => {
    const parts = getCurrentUtterance();
    const last = parts[parts.length - 1];
    const content = parts
      .map(({ text }) => text)
      .join(' ')
      .trim();

    /**
     * if the entire utterance is empty, don't go any further
     * for example, many many many empty transcription responses
     */
    if (!content) {
      return;
    }

    /**
   * onTranscipt can occasionally get the same content several times.
   * This check guards against that scenario.
   * If the TTS has finished playing, but the user has not started speaking yet, then
   * clearTranscriptParts and return.
   */
    if (!activeAssistantResponse.current) {
      if (!activeUserResponse.current) {
        console.log('User response has not started. Clearing transcript.');
        clearTranscriptParts();
        return;
      }
    }

    /**
     * failsafe was triggered since we last sent a message to TTS
     */
    if (failsafeTriggered) {
      clearTranscriptParts();
      setCurrentUtterance(undefined);
      return;
    }

    /**
     * display the concatenated utterances
     */
    setCurrentUtterance(content);

    /**
     * record the last time we recieved a word
     */
    if (last.text !== '') {
      setLastUtterance(Date.now());
    }

    /**
     * if the last part of the utterance, empty or not, is speech_final, send to the LLM.
     */
    if (last && last.speech_final) {
      // console.log('final speech'); //debug
      appendUserSpeechMessage(content);
      clearFailsafeTimeout();
      clearTranscriptParts();
      setCurrentUtterance(undefined);
    }
  }, [
    getCurrentUtterance,
    clearTranscriptParts,
    failsafeTriggered,
  ]);

  // Append user-generated content to the chat.
  const appendUserMessage = (inputString) => {
    append({
      role: 'user',
      content: inputString,
    });
  };

  /**
   * magic microphone audio queue processing
   */
  useEffect(() => {
    const processQueue = async () => {
      if (microphoneQueueSize > 0 && !isProcessing) {
        setProcessing(true);

        if (state.connectionReady) { // Use connectionReady from state
          const nextBlob = firstBlob;

          if (nextBlob && nextBlob?.size > 0) {
            state.connection?.send(nextBlob); // Use connection from state
          }
          removeBlob();
        }

        const waiting = setTimeout(() => {
          clearTimeout(waiting);
          setProcessing(false);
        }, 200);
      }
    };

    processQueue();
  }, [
    state.connection, // Use connection from state
    state.connectionReady, // Use connectionReady from state
    firstBlob,
    microphoneQueueSize,
    isProcessing,
    removeBlob,
  ]);

  /**
   * keep deepgram connection alive when mic closed
   */
  useEffect(() => {
    let keepAlive: NodeJS.Timeout | null = null;

    if (state.connection && state.connectionReady && !microphoneOpen) {
      keepAlive = setInterval(() => {
        // should stop spamming dev console when working on frontend in devmode
        if (state.connection) {
          if (state.connection.getReadyState() !== LiveConnectionState.OPEN) {
            if (keepAlive) clearInterval(keepAlive);
          } else {
            state.connection.keepAlive();
          }
        }
      }, 10000);
    } else {
      if (keepAlive) clearInterval(keepAlive);
    }

    // prevent duplicate timeouts
    return () => {
      if (keepAlive) clearInterval(keepAlive);
    };
  }, [state.connection, state.connectionReady, microphoneOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messageMarker.current) {
        messageMarker.current.scrollIntoView({
          behavior: 'smooth', // Changed to 'smooth' for a better visual effect
          block: 'end', // Ensures the bottom of the element is aligned to the visible area
        });
      }
    }, 100); // Adding a small delay to ensure the DOM has updated

    return () => clearTimeout(timeoutId); // Cleanup to avoid unintended scrolls
  }, [chatMessages]);

  if (initialLoad) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <InitialLoad
          onSubmit={startConversation}
          connecting={state.connectionReady === false}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full antialiased max-w-7xl mx-auto">
      <div className="flex flex-col h-full w-full">
        <Header
          avatarImage={assistant.avatar}
          name={assistant.name}
          job="Cognitive Therapist"
        />
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="min-h-full flex flex-col justify-end">
              <div className="grid grid-cols-12">

                {!processingPrompt && chatMessages?.map((message, i) => {
                  if (message.id === 'AAAA' || message.id === 'AAAB') {
                    return null;
                  }
                  return <ChatBubble message={message} key={i} />;
                })}

                {currentUtterance && (
                  <RightBubble text={currentUtterance}></RightBubble>
                )}

                <div
                  className="h-16 col-start-1 col-end-13 responsive-hide"
                  ref={messageMarker}
                />
              </div>
            </div>
          </div>
        </div>
        <Controls
          messages={chatMessages}
          handleSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          input={input}
        />
      </div>
    </div>
  );
}
