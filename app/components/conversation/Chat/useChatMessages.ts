import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { envConfig } from '@/config/envConfig.client';

import { MessageRole, TranscriptMessage } from '../../../lib/conversation.type';
import { chatMessagesMockup } from './chatMessages.mockup';

function containsImage(content: string) {
  // eslint-disable-next-line no-useless-escape
  const mdImageRegex = /!\[[^\]]*\]\([^\)]+\)/;
  const containsImage = mdImageRegex.test(content);
  return containsImage;
}

export type ChatMessage = {
  id: string;
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
  const chatMessages = useMemo(
    () =>
      transcripts.reduce<ChatMessage[]>((acc, transcript) => {
        const lastMessage = acc.at(-1);

        if (
          !lastMessage ||
          containsImage(lastMessage.content) ||
          containsImage(transcript.transcript) ||
          lastMessage.role !== transcript.role
        ) {
          return acc.concat({
            id: uuidv4(),
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
      }, []),
    [transcripts]
  );

  if (envConfig.enableMockups) {
    return chatMessagesMockup;
  }
  return chatMessages;
}
