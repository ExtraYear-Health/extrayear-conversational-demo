import { useEffect, useRef } from 'react';

import { MessageRole, TranscriptMessage } from '@/lib/conversation.type';

import { LeftBubble } from '../../LeftBubble';
import { RightBubble } from '../../RightBubble';
import { useChatMessages } from './useChatMessages';

export interface ChatBubblesProps {
  transcripts?: TranscriptMessage[];
}

export function ChatBubbles({ transcripts }: ChatBubblesProps) {
  const chatBottomRef = useRef<null | HTMLDivElement>(null);

  const chatMessages = useChatMessages({
    transcripts,
  });

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
  }, [transcripts]);

  return (
    <div className="min-h-full flex flex-col justify-end">
      <div className="grid grid-cols-12">
        {chatMessages.map((chatMessage) => {
          if (chatMessage.role === MessageRole.ASSISTANT) {
            return <LeftBubble key={chatMessage.id} text={chatMessage.content} timestamp={chatMessage.timestamp} />;
          }

          if (chatMessage.role === MessageRole.USER) {
            return <RightBubble key={chatMessage.id} text={chatMessage.content} />;
          }

          return null;
        })}

        <div className="h-4 md:h-16 col-start-1 col-end-13" ref={chatBottomRef} />
      </div>
    </div>
  );
}
