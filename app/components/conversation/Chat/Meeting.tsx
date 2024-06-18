import Siriwave from 'react-siriwave';

import { useConversation } from '../context';
import { VisualItems } from './VisualItems';

export interface MeetingProps {
  audioLevel?: number;
}

export function Meeting({ audioLevel }: MeetingProps) {
  const { visualItems } = useConversation();

  return (
    <div className="h-full flex-column">
      <div className="h-full max-h-[45%] flex items-center justify-center [&_canvas]:max-w-full">
        <Siriwave theme="ios9" amplitude={audioLevel} />
      </div>

      {!!visualItems?.length && <VisualItems />}
    </div>
  );
}
