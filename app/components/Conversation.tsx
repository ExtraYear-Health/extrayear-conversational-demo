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

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function Conversation(): JSX.Element {
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
  const [useStreamingTTS, setUseStreamingTTS] = useState(true); // State to control which function to use
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Queues
   */
  const {
    add: addTranscriptPart,
    queue: transcriptParts,
    clear: clearTranscriptParts,
  } = useQueue<{ is_final: boolean; speech_final: boolean; text: string }>([]);

  const {
    add: addStreamPart,
    queue: streamParts,
    remove: removeStreamPart,
    clear: clearStreamParts,
  } = useQueue<{ text: string }>([]);

  const {
    add: addStreamBlob,
    queue: streamBlobs,
    remove: removeStreamBlob,
    clear: clearStreamBlobs,
  } = useQueue<{ blob: Blob }>([]);

  let lastIndex = 0; //fix this

  /**
   * Refs
   */
  const messageMarker = useRef<null | HTMLDivElement>(null);

  /**
   * State
   */
  const [initialLoad, setInitialLoad] = useState(true);
  const [isProcessing, setProcessing] = useState(false);

  /**
   * Request audio from API. Currently gets called when message is complete
   */
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      if (!useStreamingTTS) {
        const start = Date.now();
        const model = state.ttsOptions?.model ?? "aura-asteria-en";

        //Deepgram TTS
        const res = await fetch(`/api/speak?model=${model}`, {
          cache: "no-store",
          method: "POST",
          body: JSON.stringify(message),
        });
      
        // //ElevenLabs TTS
        // const res = await fetch('/api/natural-speak', {
        //   cache: "no-store",
        //   method: "POST",
        //   body: JSON.stringify(message),
        // });

        const headers = res.headers;
        const blob = await res.blob();

        stopMicrophone();
        
        //Delay before capturing audio. Does this work?
        const waiting = setTimeout(() => {
          clearTimeout(waiting);
          setProcessing(false);
        }, 200);

        startAudio(blob, "audio/mp3", message.id).then(() => {
          addAudio({
            id: message.id,
            blob,
            latency: Number(headers.get("X-DG-Latency")) ?? Date.now() - start,
            networkLatency: Date.now() - start,
            model,
          });

          if (player) {
            player.onended = () => {
              const waiting = setTimeout(() => {
                clearTimeout(waiting);
                setProcessing(false);
              }, 500);
              startMicrophone();
            };
          } else {
            console.error('Player is undefined');
          }
        });
      }
    },
    [state.ttsOptions?.model, addAudio, startAudio, stopMicrophone, startMicrophone, player]
  );

  const onFinish = useCallback(
    (msg: any) => {
      requestTtsAudio(msg);
    },
    [requestTtsAudio]
  );

  //Calculate LLM latency
  const onResponse = useCallback((res: Response) => {
    (async () => {
      const start = Number(res.headers.get("x-llm-start"));
      const response = Number(res.headers.get("x-llm-response"));
      dispatch({ type: 'SET_LLM_LATENCY', payload: { start, response } });
    })();
  }, [dispatch]);
 
  //Add the system message
  const systemMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "system",
      content: systemContent,
    }),
    []
  );

  //Add the time dependent greeting message
  const greetingMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "assistant",
      content: contextualGreeting(),
    }),
    []
  );

  /**
   * AI SDK
   */
  const {
    messages: chatMessages,
    append,
    handleInputChange,
    input,
    handleSubmit,
    isLoading: llmLoading,
  } = useChat({
    id: "aura",
    api: "/api/brain", //OpenAI
    //api: "/api/groq",//Groq
    initialMessages: [systemMessage, greetingMessage],
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
          append({
            role: "user",
            content: currentUtterance,
          });
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

  const [socket, setSocket] = useState(null);
  const lastIndexRef = useRef(0);
  const audioContextRef = useRef(null);
  const audioBufferQueueRef = useRef([]);
  const nextNoteTimeRef = useRef(0);

  // Initialize the AudioContext
  useEffect(() => {
    audioContextRef.current = new AudioContext();
  }, []);

  // Helper function to convert base64 string to blob
  const base64ToBlob = (base64) => {
    // Remove base64 prefix (if present) and decode the base64 string into binary data
    const byteCharacters = atob(base64.replace(/^data:([A-Za-z-+/]+);base64,/, ''));
    const byteArrays = [];

    // Split the binary data into byte-sized chunks (8-bit unsigned integers)
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    // Create a new Blob object using the binary data
    const blob = new Blob(byteArrays, { type: 'audio/mp3' });
    return blob;
  }   
  
  // Function to decode audio blobs and queue them for playing
  const decodeAndQueueAudio = (blob) => {
    if (!audioContextRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      audioContextRef.current.decodeAudioData(arrayBuffer, (audioBuffer) => {
        audioBufferQueueRef.current.push(audioBuffer);
        if (!isPlaying) {
          playAudioBuffer();
        }
      });
    };
    reader.readAsArrayBuffer(blob);
  };

  // Function to play audio from the buffer queue
  const playAudioBuffer = () => {
    setIsPlaying(true);
    const play = () => {
      if (audioBufferQueueRef.current.length > 0 && audioContextRef.current) {
        const bufferToPlay = audioBufferQueueRef.current.shift();
        const source = audioContextRef.current.createBufferSource();
        source.buffer = bufferToPlay;
        source.connect(audioContextRef.current.destination);
        source.start(nextNoteTimeRef.current);

        const bufferDuration = bufferToPlay.duration;
        nextNoteTimeRef.current += bufferDuration;
        source.onended = play;
      } else {
        setIsPlaying(false);
        nextNoteTimeRef.current = audioContextRef.current.currentTime;
      }
    };
    play();
  };

  // Watch the streamBlobs queue and decode new blobs as they arrive
  useEffect(() => {
    if (streamBlobs.length > 0) {
      const nextBlob = streamBlobs[0].blob;
      decodeAndQueueAudio(nextBlob);
      removeStreamBlob(); // This will dequeue the blob after it has been processed
    }
  }, [streamBlobs]);
  
  //Handles websocket.
  useEffect(() => {
    console.log('TTSApp mounted');
    // const voiceId = process.env.REACT_APP_VOICE_ID;
    // const model = process.env.REACT_APP_MODEL_ID;
    const voiceId = 'XrExE9yKIg1WjnnlVkGX';
    const model = 'eleven_turbo_v2';
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
        console.log('WebSocket connection established');
        const xi_api_key = '298343b56e6e7fe4a8b9c8a7c35044bb';//process.env.ELEVENLABS_API_KEY;
        console.log(xi_api_key);
        const authMessage = {
            "text": " ",
            "xi_api_key": xi_api_key,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            } 
        };
        console.log('Sending auth message:', authMessage);
        newSocket.send(JSON.stringify(authMessage));
    };

    newSocket.onerror = (error) => {
        console.error(`WebSocket Error: ${error}`);
    };

    newSocket.onclose = (event) => {
      setSocket(null);  
      if (event.wasClean) {
            console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
        } else {
            console.warn('Connection died');
        }
    };

    newSocket.onmessage = (event) => {
        const audioBase64 = JSON.parse(event.data).audio;
        if (audioBase64) {
          const audioBlob = base64ToBlob(audioBase64);
          addStreamBlob({blob: audioBlob});
        }
    };

    setSocket(newSocket);

    return () => {
        if (newSocket) {
            newSocket.close();
        }
    };
  }, []);

  //Sends text to websocket for TTS conversions
  const handleTextToSpeech = (streamText) => {
    if (socket) {
        const textMessage = {
            "text": streamText,
            "try_trigger_generation": false,
            "flush": false,
        };
        console.log('Sending text to speech:', textMessage);
        socket.send(JSON.stringify(textMessage));
    }
  };

  const endTextToSpeech = () => {
    if (socket) {
      const eosMessage = {
        "text": ""
      };
      console.log('Sending eos');
      socket.send(JSON.stringify(eosMessage));
    }
  };
    
  //Separate out full sentences from LLM stream response
  useEffect(() => {
    // console.log('chatmessages', chatMessages[chatMessages.length - 1].content);
    // console.log('llmloading', llmLoading);

    if(llmLoading){
      let currentMessage = chatMessages[chatMessages.length - 1].content;
      let splitters = [".", ",", "?", "!", ";", ":", "—", "-", "(", ")", "[", "]", "}"];
      // Iterate through the streamingText starting from the lastIndex
      for (let i = lastIndexRef.current; i < currentMessage.length; i++) {
        // Check if the current character is a splitter
        if (splitters.includes(currentMessage[i])) {
            // Avoid capturing text if the splitter is at the start of the stream
            if (i > lastIndex) {
                const segment = currentMessage.substring(lastIndexRef.current, i + 1).trim();
                console.log('segment', segment);
                addStreamPart({text: segment});
                //segments.push(segment);
                //Audiod segments[segments.length -1]
            }
          // Update lastIndex to the position after the current splitter
          lastIndexRef.current = i + 1;
          console.log('last index', lastIndexRef.current);
        }
      }
    }
  },[chatMessages,]);

  //Send sentences over websocket. Return a blob.
  useEffect(() => {
    if (streamParts.length > 0) {
      console.log('streamParts');
      let text = streamParts[0].text
        .replaceAll("¡", "")
        .replaceAll("https://", "")
        .replaceAll("http://", "")
        .replaceAll(".com", " dot com")
        .replaceAll(".org", " dot org")
        .replaceAll(".co.uk", " dot co dot UK")
        .replaceAll(/```[\s\S]*?```/g, "\nAs shown on the app.\n")
        .replaceAll(
        /([a-zA-Z0-9])\/([a-zA-Z0-9])/g,
        (match, precedingText, followingText) => {
            return precedingText + " forward slash " + followingText;
        }
        );
      handleTextToSpeech(text);
      removeStreamPart();
    }

  },[streamParts,]);

  // useEffect(() => {
  //   // Exit early if there's no blob to play or if audio is already playing
  //   if (streamBlobs.length === 0 || isPlaying) return;
  
  //   setIsPlaying(true); // Set to true when playback starts
  //   const blob = streamBlobs[0].blob; // Play from the front of the queue
  //   console.log('Playing audio');
  
  //   startAudio(blob, "audio/mp3").then(() => {
  //     const handleAudioEnd = () => {
  //       console.log('Audio ended');
  //       // Introduce a 100ms delay before allowing another playback to start
  //       setTimeout(() => {
  //         setIsPlaying(false);
  //         removeStreamBlob(); // Assume this removes the first blob
  //         // Optionally, trigger the next audio here if automatic playback of queue is needed
  //       }, 100);
  //     };
  
  //     player.onended = handleAudioEnd;
  
  //     return () => {
  //       if (player) player.onended = null; // Properly place cleanup to detach event listener
  //     };
  //   }).catch(error => {
  //     console.error('Error playing audio:', error);
  //     setIsPlaying(false); // Ensure isPlaying is set to false on error
  //   });
  
  //   // Cleanup function to ensure no memory leaks
  //   return () => {
  //     if (player) player.onended = null;
  //   };
  // }, [streamBlobs, isPlaying, startAudio, player, setIsPlaying, removeStreamBlob]);
  

  // useEffect(() => {
  //   // Check if player is defined and blob is available in the latest streamBlob entry
  //   if (streamBlobs.length > 0 && !isPlaying) {
  //     console.log('playing audio');
  //       setIsPlaying(true); // Set to true when playback starts
  //       const blob = streamBlobs[streamBlobs.length - 1].blob;  // Assuming streamBlobs stores objects with a blob property

  //       // Start playing the latest blob
  //       startAudio(blob, "audio/mp3").then(() => {
  //           // Handle audio completion
  //           const handleAudioEnd = () => {
  //             setIsPlaying(false);
  //             console.log('audio end');
  //             removeStreamBlob(); // Assuming this function removes the blob that was just played
  //             //clearTimeout(waiting); // Clears the timeout if audio ends before 500ms
  //             //startMicrophone();  
  //             //setProcessing(false);
  //           };

  //           //const waiting = setTimeout(handleAudioEnd, 200);
  //           // player.onended = () => {
  //           //   const waiting = setTimeout(() => {
  //           //     clearTimeout(waiting);
  //           //     setProcessing(false);
  //           //   }, 500);

  //           player.onended = handleAudioEnd;

  //           // Clean up function to remove the event listener
  //           return () => {
  //               player.onended = null;
  //               //clearTimeout(waiting);
  //           };
  //       }).catch(error => {
  //           console.error('Error playing audio:', error);
  //       });
  //   } 
  // }, [streamBlobs, isPlaying]);  // Include all dependencies [player, streamBlobs, startAudio, setProcessing, startMicrophone]);  // Include all dependencies

  // useEffect(() => {
  //   return () => {
  //       if (player && player.onended) {
  //           player.onended = null; // Remove event listener
  //       }
  //       // If using a timeout to delay a state update or another action
  //       clearTimeout(waiting);
  //   };
  // }, [player]);
  
  useEffect(() => {
    if (llmLoading) return;
    if (!state.llmLatency) return;

    const latestLlmMessage: MessageMetadata = {
      ...chatMessages[chatMessages.length - 1],
      ...state.llmLatency,
      end: Date.now(),
      ttsModel: state.ttsOptions?.model,
    };

    //Currently adds message at the end of the LLM response (does not update during stream).
    addMessageData(latestLlmMessage);
    
    //dk1891 added these lines:
    clearStreamParts;
    clearStreamBlobs;
    // A variable to hold the index after the last splitter
    lastIndex = 0;
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
    const welcomeMetadata: MessageMetadata = {
      ...greetingMessage,
      ttsModel: state.ttsOptions?.model,
    };

    addMessageData(welcomeMetadata);

    // get welcome audio
    requestWelcomeAudio();
  }, [
    addMessageData,
    greetingMessage,
    initialLoad,
    requestWelcomeAudio,
    state.ttsOptions?.model,
  ]);

  //updates for microphone input
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
      clearTimeout(failsafeTimeout);
      append({
        role: "user",
        content,
      });
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


  // this works
  useEffect(() => {
    if (messageMarker.current) {
      messageMarker.current.scrollIntoView({
        behavior: "auto",
      });
    }
  }, [chatMessages]);

  // interface InitialLoadProps {
  //   fn: () => void;
  //   connecting: boolean; // Define that this component also expects a boolean 'connecting' prop
  // }
  
  // const InitialLoad: React.FC<InitialLoadProps> = ({ fn, connecting }) => {
  //   // Implementation of the component
  //   return (
  //     <div>
  //       {/* Display something based on 'connecting' */}
  //       {connecting ? "Connecting..." : "Ready to Start"}
  //       <button onClick={fn}>Start</button>
  //     </div>
  //   );
  // };

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
                        {chatMessages.length > 0 &&
                          chatMessages.map((message, i) => (
                            <ChatBubble message={message} key={i} />
                          ))}

                        {currentUtterance && (
                          <RightBubble text={currentUtterance}></RightBubble>
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