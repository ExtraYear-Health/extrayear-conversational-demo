import { Button, Switch } from '@nextui-org/react';
import { useState } from 'react';

import { Header } from '../Header';
import { useConversation } from '../context';

import { ChatBubbles } from './ChatBubbles';
import { Meeting, MeetingProps } from './Meeting';

import { TranscriptMessage } from '@/app/lib/conversation.type';

export interface ChatProps extends Pick<MeetingProps, 'audioLevel'> {
  isAssistantSpeeching?: boolean;
  onEndCall?(): void;
  transcripts?: TranscriptMessage[];
}

export function Chat({
  audioLevel,
  isAssistantSpeeching,
  onEndCall,
  transcripts = [],
}: ChatProps) {
  const { assistant } = useConversation();

  const [showTranscript, setShowTranscript] = useState(true);

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
            {showTranscript ? <ChatBubbles transcripts={transcripts} /> : <Meeting audioLevel={audioLevel} />}
          </div>
        </div>

        <div className="py-4 px-3 flex justify-between">
          <Switch
            size="sm"
            defaultSelected
            checked={showTranscript}
            onChange={(event) => {
              setShowTranscript(event.target.checked);
            }}
          >
            Show Transcript
          </Switch>
          <Button color="danger" onClick={onEndCall}>
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
}
