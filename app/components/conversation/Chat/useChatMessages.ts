import { useMemo } from 'react';

import { MessageRole, TranscriptMessage } from '../../../lib/conversation.type';

import { chatMessagesMockup } from './chatMessages.mockup';

import { envConfig } from '@/app/config/envConfig.client';

function containsImage(content: string) {
  const mdImageRegex = /!\[[^\]]*\]\([^\)]+\)/;
  const containsImage = mdImageRegex.test(content);
  return containsImage; ;
}

export type ChatMessage = {
  role: MessageRole;
  timestamp: string;
  content: string;
};

export interface UseChatMessagesProps {
  transcripts?: Omit<TranscriptMessage, 'type'>[];
}

/**
 * Hook to join consecutive transcripts done by the same user role
 * However if message contains an image, it will be displayed in a separate chat bubble
 * Each ChatMessage represents a chat bubble.
 */
export function useChatMessages({ transcripts = [] }: UseChatMessagesProps): ChatMessage[] {
  const chatMessages = useMemo(() => transcripts.reduce<ChatMessage[]>((acc, transcript) => {
    const lastMessage = acc.at(-1);

    if (
      !lastMessage ||
      containsImage(lastMessage.content) ||
      containsImage(transcript.transcript) ||
      lastMessage.role !== transcript.role
    ) {
      return acc.concat({
        timestamp: transcript.timestamp,
        role: transcript.role,
        content: transcript.transcript,
      });
    }

    acc[acc.length - 1] = {
      ...lastMessage,
      content: `${lastMessage.content} ${transcript.transcript}`,
    };

    return acc;
  }, []), [transcripts]);

  if (envConfig.enableMockups) {
    return chatMessagesMockup;
  }
  return chatMessages;
}
