'use client';

import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from '@deepgram/sdk';
import { Message, useChat } from 'ai/react';
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
import { useCobraVAD } from '../lib/picovoice/useCobraVAD';

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
    queueSize: microphoneQueueSize,
    firstBlob,
    removeBlob,
    startMicrophone,
  } = useMicrophone();

  /**
   * Queues
   */
  const {
    add: addTranscriptPart,
    queue: transcriptParts,
    clear: clearTranscriptParts,
  } = useQueue<{
    isFinal: boolean;
    text: string;
  }>([]);

  /**
   * Refs
   */
  const chatBottomRef = useRef<null | HTMLDivElement>(null);
  const lastLlmMessageHasBeenCleaned = useRef<boolean>(false);

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
        });
      } catch (error) {
        // Log and optionally handle errors more explicitly
        console.error('Error fetching audio:', error);
      }
    },
    // Dependencies for useCallback to ensure the function updates when necessary
    [addAudio, startAudio, state.ttsOptions?.model, state.ttsOptions?.ttsProvider],
  );

  // An optional callback that will be called when the chat stream ends
  const onFinish = useCallback((rawMessage: Message) => {
    lastLlmMessageHasBeenCleaned.current = false;

    const message: Message = {
      ...rawMessage,
      content: cleanString(rawMessage.content),
    };

    requestTtsAudio(message);
  }, [requestTtsAudio]);

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
  const eventListenerAdded = useRef<boolean>(false); // used to protect against multiple event listeners being added

  // Append user-generated content to the chat.
  const appendUserSpeechMessage = useCallback(async (inputString) => {
    console.log('append user message');

    await append({
      role: 'user',
      content: inputString,
    });
  }, [append]);

  const { isSpeeching } = useCobraVAD({
    listening: microphoneOpen,
    voiceProbThreshold: state.vadOptions?.voiceProbThreshold,
    silenceThresholdMs: state.sttOptions.utterance_end_ms,
    onSpeechStart() {
      clearTranscriptParts();
      if (!player?.ended) {
        stopAudio();
      }
    },
    onSpeechEnd() {
      if (currentUtterance) {
        console.log('Send message to LLM');
        appendUserSpeechMessage(currentUtterance);
        clearTranscriptParts();
        setCurrentUtterance(undefined);
      }
    },
  });

  useEffect(() => {
    if (llmLoading || !state.llmLatency || lastLlmMessageHasBeenCleaned.current) {
      return;
    }

    // Hack way to remove extra characters from the LLM response.
    const messages = chatMessages.map((message, index) => {
      if (index === chatMessages.length - 1) {
        return {
          ...message,
          content: cleanString(message.content),
        };
      }
      return message;
    });

    setMessages(messages);
    lastLlmMessageHasBeenCleaned.current = true;

    const latestLlmMessage: MessageMetadata = {
      ...messages.at(-1),
      ...state.llmLatency,
      end: Date.now(),
      ttsModel: state.ttsOptions?.model,
    };
    addMessageData(latestLlmMessage);
  }, [addMessageData, chatMessages, llmLoading, setMessages, state.llmLatency, state.ttsOptions?.model]);

  /**
   * Contextual functions
   */
  const startConversation = useCallback(async () => {
    if (!initialLoad) return;

    setInitialLoad(false);
    startMicrophone();

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
    const welcomeMetadata: MessageMetadata = {
      ...greetingMessage,
      ttsModel: state.ttsOptions?.model,
    };

    addMessageData(welcomeMetadata);
  }, [addMessageData, assistant.name, initialLoad, requestTtsAudio, setMessages, startMicrophone, state.selectedPromptId, state.ttsOptions?.model]);

  const onTranscript = useCallback((data: LiveTranscriptionEvent) => {
    const content = utteranceText(data);

    if (content !== '') {
      console.log('Transcript added to queue: ', content);
      addTranscriptPart({
        isFinal: !!data.is_final,
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

  /**
   * To gather a full transcript for an utterance, you would need to concatenate all responses marked is_final: true.
   * https://developers.deepgram.com/docs/understand-endpointing-interim-results#getting-final-transcripts
   */
  const getCurrentUtterance = useCallback(() => {
    const transcripts = transcriptParts.filter(({ isFinal }, i, arr) => {
      return isFinal || (!isFinal && i === arr.length - 1);
    });

    const utterance = transcripts.map(({ text }) => text).join(' ').trim();
    return utterance;
  }, [transcriptParts]);

  useEffect(() => {
    if (!isSpeeching) {
      return;
    }

    const utterance = getCurrentUtterance();

    /**
     * If the entire utterance is empty, don't go any further
     * for example, many many many empty transcription responses
     */
    if (!utterance) {
      return;
    }

    setCurrentUtterance(utterance);
  }, [isSpeeching, getCurrentUtterance]);

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

    if (state.connection && state.connectionReady) {
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
