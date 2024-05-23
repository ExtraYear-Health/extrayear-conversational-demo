'use client';

import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from '@deepgram/sdk';
import { Message, useChat } from 'ai/react';
import { useMicVAD } from '@ricky0123/vad-react';
import { useNowPlaying } from 'react-nowplaying';
import { useQueue } from '@uidotdev/usehooks';
import { useState, useEffect, useCallback, useRef } from 'react';

import {
  generateRandomString,
  utteranceText,
  cleanString,
} from '../lib/helpers';
import { MessageMetadata } from '../lib/types';
import { useDeepgram, voiceMap } from '../context/Deepgram';
import { useMessageData } from '../context/MessageMetadata';
import { useMicrophone } from '../context/Microphone';
import { useAudioStore } from '../context/AudioStore';

import { RightBubble } from './RightBubble';
import { Controls } from './Controls';
import { ChatBubble } from './ChatBubble';
import { Header } from './conversation/Header';
import { InitialLoad } from './InitialLoad';
import { getIntroMessage } from './conversation/actions';

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
  const chatBottomRef = useRef<null | HTMLDivElement>(null);
  const activeAssistantResponse = useRef<boolean>(false);
  const activeUserResponse = useRef<boolean>(false);

  /**
   * State
   */
  const [isProcessing, setProcessing] = useState(false);

  const [initialLoad, setInitialLoad] = useState(true);

  const assistant = voiceMap(state.ttsOptions.model);

  // Defines a memoized function to request TTS audio using current TTS settings.
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      const start = Date.now();
      const model = state.ttsOptions?.model ?? 'aura-asteria-en'; // Default model fallback

      try {
        // Request audio generation based on the TTS provider set in the state
        const res: Response | null = await fetch(`/api/speak?model=${model}`, {
          cache: 'no-store',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });

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

  // Define an interface to structure the data for AI model parameters within the application
  interface BodyApiType {
    llmModel: string;
    temperature: number;
    maxTokens: number;
    llmProvider: string;
    promptId: string;
    templateVars: {
      assistantName?: string;
    };
  }

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
    setMessages,
  } = useChat({
    id: 'aura',
    api: '/api/brain',
    body: {
      llmProvider: state.llm.llmProvider,
      llmModel: state.llm.llmModel,
      temperature: state.llm.settings.temperature,
      maxTokens: state.llm.settings.maxTokens,
      promptId: state.selectedPromptId,
      templateVars: {
        assistantName: assistant.name,
      },
    } satisfies BodyApiType,
    initialMessages: [],
    onFinish,
    onResponse,
  });

  const [currentUtterance, setCurrentUtterance] = useState<string>();
  const [failsafeTriggered, setFailsafeTriggered] = useState<boolean>(false);
  const failsafeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<string>();
  const eventListenerAdded = useRef<boolean>(false); // used to protect against multiple event listeners being added
  const [utteranceEnded, setUtteranceEnded] = useState<boolean>(false);

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

  // Append user-generated content to the chat.
  const appendUserSpeechMessage = useCallback((inputString) => {
    if (activeUserResponse.current) {
      console.log('append user message');
      setUtteranceEnded(false);
      stopMicrophone(); // stop the microphone now. The microphone will start again after TTS plays.
      activeAssistantResponse.current = true; // appending the user message automatically starts the LLM response.
      activeUserResponse.current = false; // this flag prevents another message being appended until onSpeechStart runs again.
      append({
        role: 'user',
        content: inputString,
      });
    }
  }, [append, stopMicrophone]);

  const setupFailsafeTimeout = useCallback(() => {
    const failsafeAction = () => {
      const utterance = currentUtteranceRef.current;
      if (utterance) {
        console.log('failsafe fires! pew pew!!');
        setFailsafeTriggered(true);
        appendUserSpeechMessage(utterance);
        clearTranscriptParts();
        setCurrentUtterance(undefined);
        setUtteranceEnded(false);
        currentUtteranceRef.current = undefined; // Reset the ref
      }
    };
    // Clear any existing timeout before setting a new one
    clearFailsafeTimeout();
    // Set the new failsafe timeout
    failsafeTimeoutRef.current = setTimeout(failsafeAction, state.sttOptions.utterance_end_ms + 500);
  }, [state.sttOptions.utterance_end_ms, appendUserSpeechMessage, clearTranscriptParts]);

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
    }
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
  const startConversation = useCallback(async () => {
    if (!initialLoad) return;

    setInitialLoad(false);

    const intro = await getIntroMessage(state.selectedPromptId, {
      assistantName: assistant.name,
    });

    const greetingMessage = {
      id: generateRandomString(7),
      role: 'assistant',
      content: intro,
    } as Message;

    setMessages([greetingMessage]);
    requestTtsAudio(greetingMessage); // request welcome audio

    // add a stub message data with no latency
    const promptMetadata: MessageMetadata = {
      ttsModel: state.ttsOptions?.model,
    };

    // add a stub message data with no latency
    const welcomeMetadata: MessageMetadata = {
      ...greetingMessage,
      ttsModel: state.ttsOptions?.model,
    };

    addMessageData(promptMetadata);
    addMessageData(welcomeMetadata);
  }, [addMessageData, assistant.name, initialLoad, requestTtsAudio, setMessages, state.selectedPromptId, state.ttsOptions?.model]);

  const onTranscript = useCallback((data: LiveTranscriptionEvent) => {
    const content = utteranceText(data);
    // console.log('transcript', content); //debug

    if (content !== '' || data.speech_final) {
      addTranscriptPart({
        is_final: data.is_final as boolean,
        speech_final: data.speech_final as boolean,
        text: content,
      });
    }
  }, [addTranscriptPart]);

  const onUtteranceEnd = useCallback(() => {
    setUtteranceEnded(true);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      if (state.connectionReady && !eventListenerAdded.current) {
        state.connection?.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
        state.connection?.addListener(LiveTranscriptionEvents.UtteranceEnd, onUtteranceEnd);
        eventListenerAdded.current = true;
      }
    };

    if (state.connection) {
      state.connection.addListener(LiveTranscriptionEvents.Open, onOpen);
      return () => {
        state.connection?.removeListener(LiveTranscriptionEvents.Open, onOpen);
        if (state.connectionReady && eventListenerAdded.current) {
          state.connection?.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
          state.connection?.removeListener(LiveTranscriptionEvents.UtteranceEnd, onUtteranceEnd);
          eventListenerAdded.current = false;
        }
      };
    }
  }, [state.connection, state.connectionReady, onTranscript, onUtteranceEnd]);

  const getCurrentUtterance = useCallback(() => {
    const filteredParts = transcriptParts.filter(({ is_final, speech_final }, i, arr) => {
      return is_final || speech_final || (!is_final && i === arr.length - 1);
    });
    // console.log('filter parts', filteredParts); //debug
    return filteredParts; // Return the result as before
  }, [transcriptParts]);

  const [lastUtterance, setLastUtterance] = useState<number>();

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
    if (last && last.speech_final && utteranceEnded) {
      // console.log('final speech'); //debug
      appendUserSpeechMessage(content);
      clearFailsafeTimeout();
      clearTranscriptParts();
      setCurrentUtterance(undefined);
      setUtteranceEnded(false);
    }
  }, [
    getCurrentUtterance,
    clearTranscriptParts,
    failsafeTriggered,
    utteranceEnded,
    appendUserSpeechMessage,
  ]);

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
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({
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

                {chatMessages?.map((message, i) => {
                  if (message.id === 'AAAA' || message.id === 'AAAB') {
                    return null;
                  }
                  return <ChatBubble message={message} key={i} />;
                })}

                {currentUtterance && (
                  <RightBubble text={currentUtterance}></RightBubble>
                )}

                <div
                  className="h-4 md:h-16 col-start-1 col-end-13"
                  ref={chatBottomRef}
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
