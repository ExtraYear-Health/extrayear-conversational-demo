import Siriwave from 'react-siriwave';

export interface MeetingProps {
  audioLevel?: number;
}

export function Meeting({ audioLevel }: MeetingProps) {
  return (
    <div className="h-full flex items-center justify-center [&_canvas]:max-w-full">
      <Siriwave
        theme="ios9"
        amplitude={audioLevel}
      />
    </div>
  );
}
