"use client";

import {
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { Message, useChat } from "ai/react";
import { NextUIProvider } from "@nextui-org/react";
import { useMicVAD } from "@ricky0123/vad-react";
import { useNowPlaying } from "react-nowplaying";
import { useQueue } from "@uidotdev/usehooks";
import { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";

import { ChatBubble } from "./ChatBubble";
import {
  contextualGreeting,
  generateRandomString,
  utteranceText,
  promptTextArray,
  extractIntroContent,
  cleanString,
} from "../lib/helpers";
import { Controls } from "./Controls";
import { InitialLoad } from "./InitialLoad";
import { MessageMetadata } from "../lib/types";
import { RightBubble } from "./RightBubble";
import { systemContent } from "../lib/constants";
import { useDeepgram } from "../context/Deepgram";
import { useMessageData } from "../context/MessageMetadata";
import { useMicrophone } from "../context/Microphone";
import { useAudioStore } from "../context/AudioStore";
import { useMessageCheck } from "../context/MessageCheck";

import { articleConversationContent } from "../prompts/articleConversation";
import { voyager1ConversationContent } from "../prompts/voyager1Conversation";
import { newsArticleConversationContent } from "../prompts/newsArticlesConversation";
import { checkMessagePromptContent } from "../prompts/checkMessage";
import { LeftBubble } from "./LeftBubble";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function Conversation(): JSX.Element {
  const { state, dispatch } = useDeepgram();
  const { checkMessageWithLLM } = useMessageCheck();
  const { addAudio } = useAudioStore();
  const { player, stop: stopAudio, play: startAudio } = useNowPlaying();
  const { addMessageData } = useMessageData();
  const [promptLines, setPromptLines] = useState([]);
  const [introContent, setIntroContent] = useState(null);
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
  } = useQueue<{ is_final: boolean; speech_final: boolean; text: string }>([]);

  /**
   * Refs
   */
  const messageMarker = useRef<null | HTMLDivElement>(null);
  const mainThread = useRef(true);

  /**
   * State
   */
  const [initialLoad, setInitialLoad] = useState(true);
  const [isProcessing, setProcessing] = useState(false);
  const [processingPrompt, setProcessingPrompt] = useState(true);
  const [promptLineCount, setPromptLineCount] = useState(0);  // Initialize the counter to 0

  // Get prompt. Store the individual lines in an array. Set prompt line counter.
  useEffect(() => {
    if (processingPrompt) {
      const promptString = newsArticleConversationContent; 
      // Check if newsArticleConversationContent is null, undefined, or empty
      if (!promptString || promptString.trim() === '') {
        console.log('newsArticleConversationContent is null or empty');
        // Optional: Handle the case where the content is not valid, e.g., set error state or early exit
        return; // Early exit from the useEffect if content is invalid
      }
  
      // Convert the imported content into an array of lines
      const processedLines = promptTextArray(newsArticleConversationContent);
      const extractedContent = extractIntroContent(newsArticleConversationContent);
  
      // Update the state with the processed lines and extracted content
      setPromptLines(processedLines);
      setIntroContent(extractedContent);
      
      setPromptLineCount(promptLineCount + 2); //Start at line #2
      setProcessingPrompt(false);
    }
  }, [processingPrompt, newsArticleConversationContent]);

  /**
   * Request audio from API
   */
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      const start = Date.now();
      const model = state.ttsOptions?.model ?? "aura-asteria-en";
  
      console.log('ttsprovider', state.ttsOptions?.ttsProvider);
  
      let res: Response | null = null;
      try {
        if (state.ttsOptions?.ttsProvider === 'deepgram') {
          res = await fetch(`/api/speak?model=${model}`, {
            cache: "no-store",
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(message),
          });
        } else if (state.ttsOptions?.ttsProvider === 'elevenlabs') {
          res = await fetch('/api/natural-speak', {
            cache: "no-store",
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message, voiceId: state.ttsOptions?.voiceId }),
          });
        }
  
        if (!res || !res.ok) {
          console.error('Failed to fetch:', state.ttsOptions?.ttsProvider, res?.statusText);
          return;
        }
  
        const blob = await res.blob();
        stopMicrophone();
  
        const latency = Number(res.headers.get("X-DG-Latency")) ?? Date.now() - start;
  
        startAudio(blob, "audio/mp3", message.id).then(() => {
          addAudio({
            id: message.id,
            blob,
            latency,
            networkLatency: Date.now() - start,
            model,
          });
  
          if (player) {
            player.onended = () => {
              setProcessing(false);
              startMicrophone();
            };
          } else {
            console.error('Player is undefined');
          }
        });
  
      } catch (error) {
        console.error('Error fetching audio:', error);
        // Optionally, handle this case more explicitly by notifying the user.
      }
    },
    [state.ttsOptions, addAudio, startAudio, stopMicrophone, startMicrophone, player]
  );

  //An optional callback that will be called when the chat stream ends
  const onFinish = useCallback(
    (msg: any) => {
      requestTtsAudio(msg);
    },
    [requestTtsAudio]
  );

  //An optional callback that will be called with the response from the API endpoint. Useful for throwing customized errors or logging
  const onResponse = useCallback((res: Response) => {
    (async () => {
      const start = Number(res.headers.get("x-llm-start"));
      const response = Number(res.headers.get("x-llm-response"));
      dispatch({ type: 'SET_LLM_LATENCY', payload: { start, response } });
    })();
  }, [dispatch]);

  const systemMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "system",
      content: systemContent,
    }),
    []
  );

  const greetingMessage: Message = useMemo(() => ({
    id: generateRandomString(7),
    role: "assistant",
    content: introContent,
  }), [introContent]);  // Include the content variable in the dependency array
  
  const promptMessage: Message = useMemo(() => ({
    id: 'AAAA',  // Consider using a unique ID for each instance if needed
    role: "user",
    content: promptLines[0],
  }), [promptLines[0]]); 

  /**
   * AI SDK for the voicebot conversation
   */
  const {
    messages: chatMessages,
    append,
    handleInputChange,
    input,
    //handleSubmit,
    isLoading: llmLoading,
    setInput,
  } = useChat({
    id: "aura",
    //api: "/api/brain", //OpenAI
    api: "/api/groq",//Groq
    initialMessages: [systemMessage, promptMessage, greetingMessage],
    onFinish,
    onResponse,
  });

  const [currentUtterance, setCurrentUtterance] = useState<string>();
  const [failsafeTimeout, setFailsafeTimeout] = useState<NodeJS.Timeout>();
  const [failsafeTriggered, setFailsafeTriggered] = useState<boolean>(false);

  const onSpeechEnd = useCallback(() => {
    /**
     * We have the audio data context available in VAD
     * even before we start sending it to deepgram.
     * So ignore any VAD events before we "open" the mic.
     */
    if (!microphoneOpen) return;

    setFailsafeTimeout(
      setTimeout(() => {
        if (currentUtterance) {
          console.log("failsafe fires! pew pew!!");
          setFailsafeTriggered(true);
          checkMessage(currentUtterance); //if failsafe triggers then send whatever is in currentutterance to the LLM
          clearTimeout(failsafeTimeout);
          clearTranscriptParts();
          setCurrentUtterance(undefined);
        }
      }, 1500)
    );

    return () => {
      clearTimeout(failsafeTimeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneOpen, currentUtterance]);

  const onSpeechStart = () => {
    /**
     * We have the audio data context available in VAD
     * even before we start sending it to deepgram.
     * So ignore any VAD events before we "open" the mic.
     */
    if (!microphoneOpen) return;

    /**
     * We we're talking again, we want to wait for a transcript.
     */
    setFailsafeTriggered(false);

    if (!player?.ended) {
      stopAudio();
      console.log("barging in! SHH!");
    }
  };

  useMicVAD({
    startOnLoad: true,
    stream,
    onSpeechStart,
    onSpeechEnd,
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.6 - 0.15,
  });

  useEffect(() => {
    if (llmLoading) {
      //don't listen for voice input while LLM response is generating and displaying
      stopMicrophone();
      return;
    };
    if (!state.llmLatency) return;

    //Remove extra characters from LLM response.
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
    state.llmLatency,  // Update dependency to use state from context
    llmLoading,
    addMessageData,
    state.ttsOptions?.model,  // Update dependency to use state from context
  ]);

  /**
   * Contextual functions
   */
  const requestWelcomeAudio = useCallback(async () => {
    requestTtsAudio(greetingMessage);
  }, [greetingMessage, requestTtsAudio]);

  const startConversation = useCallback(() => {
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

    if (content !== "" || data.speech_final) {
      addTranscriptPart({
        is_final: data.is_final as boolean,
        speech_final: data.speech_final as boolean,
        text: content,
      });
    }
  }, [addTranscriptPart]);

  useEffect(() => {
    const onOpen = () => {
      state.connection?.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    };

    if (state.connection) {// && state.connectionReady
      state.connection.addListener(LiveTranscriptionEvents.Open, onOpen);
      return () => {
        state.connection?.removeListener(LiveTranscriptionEvents.Open, onOpen);
        state.connection?.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      };
    }
  }, [state.connection, onTranscript]);

  const getCurrentUtterance = useCallback(() => {
    return transcriptParts.filter(({ is_final, speech_final }, i, arr) => {
      return is_final || speech_final || (!is_final && i === arr.length - 1);
    });
  }, [transcriptParts]);

  const [lastUtterance, setLastUtterance] = useState<number>();

  useEffect(() => {
    const parts = getCurrentUtterance();
    const last = parts[parts.length - 1];
    const content = parts
      .map(({ text }) => text)
      .join(" ")
      .trim();

    /**
     * if the entire utterance is empty, don't go any further
     * for example, many many many empty transcription responses
     */
    if (!content) return;

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
    if (last.text !== "") {
      setLastUtterance(Date.now());
    }

    /**
     * if the last part of the utterance, empty or not, is speech_final, send to the LLM.
     */
    if (last && last.speech_final) {
      checkMessage(content); 
      clearTimeout(failsafeTimeout);
      clearTranscriptParts();
      setCurrentUtterance(undefined);
    }
  }, [
    getCurrentUtterance,
    clearTranscriptParts,
    append,
    failsafeTimeout,
    failsafeTriggered,
  ]);

  /**
   * Check if response is a good answer to the prompt
   */

  // const [checkResponse, setCheckResponse] = useState(false);
  // const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState(null);
  const [responseStarted, setResponseStarted] = useState(false);
  const [onMainThread, setOnMainThread] = useState(true);
  const [mainThreadPromptMarker, setMainThreadPromptMarker] = useState(0);
  const [mainThreadMessageMarker, setMainThreadMessageMarker] = useState(0);  //need this?

  const checkSystemMessage:Message = useMemo(() => ({
    id: generateRandomString(7),
    role: 'system',
    content: 'You are a helpful assistant.',
  }), []);

  const {
    messages: checkChatMessages,
    append: checkMessagesAppend,
    //handleInputChange,
    //input,
    //handleSubmit,
    isLoading: checkMessagesLlmLoading,
    stop: checkMessagesStop,
    //setInput,
  } = useChat({
    id: "brainCheck",
    //api: "/api/brainCheck", //OpenAI
    api: "/api/quickBrainCheck",//Groq
    initialMessages: [checkSystemMessage],
    onFinish: (msg) => console.log('Chat finished:'),
    onResponse: res => {
      //console.log('check message response', res);
      setResponseStarted(true);
    }
  });

  function extractProblemAnswer(content: string): string | null {
    const regex = /<problemAnswer>(.*?)<\/problemAnswer>/;
    const match = content.match(regex);
    return match ? match[1] : null;
  }

  const checkMessage = (inputString) => {
    setUserInput(inputString);
    console.log('input string', inputString);
    const patientResponse = inputString;
    const therapistPrompt = chatMessages[chatMessages.length -1].content;
    if (!therapistPrompt) { return };
    const promptInput = checkMessagePromptContent(patientResponse, therapistPrompt);
    console.log(promptInput);
    checkMessagesAppend({ //append message to messages array and initiate calling the LLM through the API endpoint.
      role: "user",
      content: promptInput,
    });
  };

  useEffect(() => {
    // Ensure there are messages and the response has started
    if (checkChatMessages.length > 0 && responseStarted) {
      const lastMessage = checkChatMessages[checkChatMessages.length - 1];
      
      // Check if the last message was sent by the user
      if (lastMessage?.role !== 'user') {
        const lastMessageContent = lastMessage?.content;
        if (lastMessageContent) {
          const answer = extractProblemAnswer(lastMessageContent);
          console.log('extracted answer', answer);
  
          const response = ` <response> ${userInput} </response>`;
          let instructions = 'Here is my response and your next instruction. Follow the instruction exactly.';
          let nextInstructions = '';
          let newPrompt = '';
  
          if (['true', 'True', 'TRUE'].includes(answer)) {
            console.log('text response true');
            if(onMainThread){
              nextInstructions = ` <instructions> ${promptLines[promptLineCount]} </instructions>`;
              setMainThreadMessageMarker(chatMessages.length + 1);
              setPromptLineCount(promptLineCount + 1);
            } else {
              nextInstructions = `Create an appropriate follow up statement to this response. Then return to this previous prompt ${chatMessages[mainThreadMessageMarker]?.content}`;
              nextInstructions = ` <instructions> ${nextInstructions} </instructions>`;
              setOnMainThread(true);
            }
          } else {
            console.log('text response false');
            setOnMainThread(false);
            nextInstructions = 'Create a follow up statement to this response. Then ask me if I would like to continue with the cognitive rehab session. Your response must be 60 words or less.';
            nextInstructions = ` <instructions> ${nextInstructions} </instructions>`;
          }
  
          newPrompt = instructions + response + nextInstructions;
          console.log('append new prompt', newPrompt);
          setUserInput(undefined);
          checkMessagesStop();
          appendUserMessage(newPrompt);
          setResponseStarted(false);
        }
      }
    }
  }, [checkChatMessages, userInput, responseStarted, onMainThread, promptLineCount, chatMessages.length, mainThreadMessageMarker]);
  

  const appendUserMessage = (inputString) => {
    // Append the modified input to the chat, triggering the LLM to process it
    append({
      role: "user",
      content: inputString,
    });
  };

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    console.log('input', input);
    if (!input.trim()) {
        console.log("Input is empty or only whitespace.");
        return; // Avoid sending empty messages
    }
    
    // Modify the input text before sending it to the LLM
    checkMessage(input);
    // const response = ' <response> ' + input + ' </response>';
    // appendUserMessage(response);
     // Clear the input field after sending
     setInput(""); // Assuming `setInput` is the state setter for your input state
}, [input, append, handleInputChange]);

  /**
   * magic microphone audio queue processing
   */
  useEffect(() => {
    const processQueue = async () => {
      if (microphoneQueueSize > 0 && !isProcessing) {
        setProcessing(true);

        if (state.connectionReady) {  // Use connectionReady from state
          const nextBlob = firstBlob;

          if (nextBlob && nextBlob?.size > 0) {
            state.connection?.send(nextBlob);  // Use connection from state
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
    state.connection,  // Use connection from state
    state.connectionReady,  // Use connectionReady from state
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
        if(state.connection){
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
          behavior: "smooth",  // Changed to 'smooth' for a better visual effect
          block: "end", // Ensures the bottom of the element is aligned to the visible area
        });
      }
    }, 100);  // Adding a small delay to ensure the DOM has updated
  
    return () => clearTimeout(timeoutId);  // Cleanup to avoid unintended scrolls
  }, [chatMessages]);

  return (
    <>
      <NextUIProvider className="h-full">
        <div className="flex h-full antialiased">
          <div className="flex flex-row h-full w-full overflow-x-hidden">
            <div className="flex flex-col flex-auto h-full">
              <div className="flex flex-col justify-between h-full">
                <div
                  className={`flex flex-col h-full overflow-hidden ${
                    initialLoad ? "justify-center" : "justify-end"
                  }`}
                >
                  <div className="grid grid-cols-12 overflow-x-auto gap-y-2">
                  {initialLoad ? (
                    <InitialLoad
                      fn={startConversation}
                      connecting={state.connectionReady === false} // Pass 'connectionReady' as the opposite of 'connecting'
                    />
                  ) : (
                    <>
                        {!processingPrompt && chatMessages.length > 0 &&
                          chatMessages.map((message, i) => {
                            if (message.id === 'AAAA'){ //|| !message.content
                              return null
                            }
                            return <ChatBubble message={message} key={i} />
                          })}

                        {currentUtterance && (
                          <RightBubble text={currentUtterance}></RightBubble>
                        )}

                        {userInput && (
                          <RightBubble text={userInput}></RightBubble>
                        )}

                        <div
                          className="h-16 col-start-1 col-end-13 responsive-hide"
                          ref={messageMarker}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
                {!initialLoad && (
                  <Controls
                    messages={chatMessages}
                    handleSubmit={handleSubmit}
                    handleInputChange={handleInputChange}
                    input={input}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </NextUIProvider>
    </>
  );
}