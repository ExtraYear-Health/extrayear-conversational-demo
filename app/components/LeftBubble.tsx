import { Message } from 'ai/react';
import { MessageAudio } from './MessageAudio';
import { MessageHeader } from './MessageHeader';
import { MessageMeta } from './MessageMeta';
import { TextContent } from './TextContext';

export const LeftBubble = ({ message }: { message: Message; }) => {
  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-end-11 md:col-end-9 lg:col-end-8 xl:col-end-7 px-3 pt-3">
        <div className="flex items-start gap-2">
          <div className="bg-default-50 flex p-4 rounded-e-xl rounded-es-xl relative">
            <div className="flex flex-col pb-2">
              <div className="text-sm font-normal text-white/80 markdown">
                <TextContent text={message.content} />
              </div>
            </div>
            <div className="absolute right-3 bottom-2">
              <MessageHeader message={message} />
            </div>
          </div>
          <div className="h-6 w-6 shrink-0 self-center">
            <MessageAudio message={message} />
          </div>
        </div>
      </div>
      <div className="col-start-1 col-end-13 pl-4 pb-3 pt-1">
        <MessageMeta message={message} />
      </div>
    </>
  );
};
