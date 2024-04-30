"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Message, useChat } from "ai/react";

import { checkMessagePromptContent } from "../prompts/checkMessage";

// Define the default values matching the expected context structure
const messageCheckDefaultContext = {
    response: null,
    loading: false,
    checkMessageWithLLM: async (inputString1: string, inputString2: string) => {} // Correctly typed as requiring two strings
};

// Create a Context
const MessageCheckContext = createContext<typeof messageCheckDefaultContext>(messageCheckDefaultContext);


// Export the custom hook for consuming the context
export const useMessageCheck = () => useContext(MessageCheckContext);

// Provider Component
export const MessageCheck = ({ children }) => {
    
    //     //An optional callback that will be called when the chat stream ends
    // const onFinish = useCallback(
    //     (msg: any) => {
    //         console.log('hello', msg);
    //     },
    //     []
    // );

    // //An optional callback that will be called with the response from the API endpoint. Useful for throwing customized errors or logging
    // const onResponse = useCallback((res: Response) => {
    //     (async () => {
    //         console.log('hello 2', res);
    //     })();
    // }, []);
    
    const { 
        messages : checkChatMessages, 
        append,
        //input,
        handleInputChange,
        handleSubmit,
        isLoading: checkLlmLoading,
        setInput,
    } = useChat({
        id: 'brainCheck',
        api: "/api/brainCheck",
        onFinish: (msg) => console.log('Chat finished:', msg),
        onResponse: (res) => console.log('Response received:', res)
    });
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkMessageWithLLM = useCallback(async (inputString1: string, inputString2: string) => {
        console.log('checking chat messages with llm');
        setLoading(true);

        const promptInput = checkMessagePromptContent(inputString1, inputString2);

        append({
            role: "user",
            content: promptInput,
        });

        // Example of handling a response (placeholder)
        // Assume `append` triggers some process that eventually updates `checkChatMessages`
    }, [append]);

    useEffect(() => {
        if (!checkLlmLoading && checkChatMessages.length > 0) {
            const lastMessage = checkChatMessages[checkChatMessages.length - 1].content;
            console.log('lastmessage llm', lastMessage);
            setResponse(lastMessage);
            setLoading(false);
        }
    }, [checkChatMessages, checkLlmLoading]);


    return (
        <MessageCheckContext.Provider value={{ response, loading, checkMessageWithLLM }}>
            {children}
        </MessageCheckContext.Provider>
    );
};

// export function useMessageCheck(){
//     return useContext(MessageCheckContext);
// }
