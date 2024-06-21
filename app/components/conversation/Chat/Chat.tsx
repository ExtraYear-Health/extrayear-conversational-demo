import { Button } from '@nextui-org/react';

import { TranscriptMessage } from '@/lib/conversation.type';

import { useConversation } from '../context';
import { Header } from '../Header';
import { Meeting, MeetingProps } from './Meeting';

export interface ChatProps extends Pick<MeetingProps, 'audioLevel'> {
  isAssistantSpeeching?: boolean;
  onEndCall?(): void;
  transcripts?: TranscriptMessage[];
}

export function Chat({ audioLevel, isAssistantSpeeching, onEndCall }: ChatProps) {
  const { activity } = useConversation();

  return (
    <div className="min-h-screen relative w-full antialiased max-w-7xl mx-auto">
      <div className="flex flex-col min-h-screen w-full">
        <Header
          avatarImage={activity.therapist?.avatar}
          isResponding={isAssistantSpeeching}
          job="Cognitive Therapist"
          name={activity.therapist?.name}
        />

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Meeting audioLevel={audioLevel} />
          </div>
        </div>

        <div className="py-4 px-3 flex justify-center">
          <Button color="danger" onClick={onEndCall}>
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
}
