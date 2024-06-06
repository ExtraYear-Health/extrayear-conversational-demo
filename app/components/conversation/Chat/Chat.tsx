import { useEffect, useRef } from 'react';
import { Button } from '@nextui-org/react';

import { LeftBubble } from '../../LeftBubble';
import { RightBubble } from '../../RightBubble';
import { Header } from '../Header';
import { useConversation } from '../context';

import { useChatMessages } from '@/app/components/conversation/Chat/useChatMessages';
import { MessageRole, TranscriptMessage } from '@/app/lib/conversation.type';

export interface ChatProps {
  isAssistantSpeeching?: boolean;
  onEndCall?(): void;
  transcripts?: TranscriptMessage[];
}

export function Chat({ transcripts = [], onEndCall, isAssistantSpeeching }: ChatProps) {
  const { assistant } = useConversation();

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
    <div className="h-full w-full antialiased max-w-7xl mx-auto">
      <div className="flex flex-col h-full w-full">
        <Header
          isResponding={isAssistantSpeeching}
          job="Cognitive Therapist"
          name={assistant.name}
        />

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="min-h-full flex flex-col justify-end">
              <div className="grid grid-cols-12">
                {chatMessages.map((chatMessage) => {
                  if (chatMessage.role === MessageRole.ASSISTANT) {
                    return (
                      <LeftBubble
                        key={chatMessage.timestamp}
                        text={chatMessage.content}
                        timestamp={chatMessage.timestamp}
                      />
                    );
                  }

                  if (chatMessage.role === MessageRole.USER) {
                    return (
                      <RightBubble
                        key={chatMessage.timestamp}
                        text={chatMessage.content}
                      />
                    );
                  }

                  return null;
                })}

                <div
                  className="h-4 md:h-16 col-start-1 col-end-13"
                  ref={chatBottomRef}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="py-4 px-2 flex justify-center">
          <Button color="danger" onClick={onEndCall}>
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
}
