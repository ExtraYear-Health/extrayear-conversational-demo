import { DateTime } from 'luxon';

import { TextContent } from './TextContext';

interface LeftBubbleProps {
  text?: string;
  timestamp?: string;
}

export const LeftBubble = ({ text, timestamp }: LeftBubbleProps) => {
  return (
    <div className="col-start-1 col-end-13 sm:col-end-11 md:col-end-9 lg:col-end-8 xl:col-end-7 px-3 pt-3">
      <div className="flex items-start gap-2">
        <div className="bg-default-50 flex p-3 pb-4 rounded-e-xl rounded-es-xl relative min-w-[200px]">
          <div className="flex flex-col pb-4">
            <div className="text-sm font-normal text-white/80 markdown">
              <TextContent text={text} />
            </div>
            <div className="flex absolute right-0 bottom-0">
              <span className="text-xs font-normal text-white/50 pr-4 pb-2">
                {DateTime.fromISO(timestamp).toFormat('h:mm a')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
