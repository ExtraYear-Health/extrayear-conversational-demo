'use client';

import { Card, Image } from '@nextui-org/react';
import { useEffect } from 'react';

import { useActionState } from '../../lib/hooks/useActionState';
import { getAssistants } from './actions';
import { useConversation } from './context';

export function Activities() {
  const { assistantId, setAssistantId } = useConversation();

  const { data, dispatch } = useActionState(getAssistants, []);

  useEffect(() => {
    dispatch();
  }, []);

  return (
    <div className="flex gap-3 overflow-auto py-5">
      {data.map((assistant) => (
        <Card
          key={assistant.id}
          isPressable
          isHoverable
          role="button"
          className={`px-5 py-3 flex-1 min-w-[300px] cursor-pointer text-left border-[2px] ${assistant.id === assistantId ? 'border-primary-500' : ''}`}
          onClick={() => {
            setAssistantId(assistant.id);
          }}
        >
          <div className="flex flex-col h-full w-full">
            <div className="text-slate-400 mb-1">w/ Michael - Social</div>
            <div className="text-lg font-semibold h-[70px]">{assistant.name}</div>

            <div className="flex-1 flex justify-center mt-1 mb-6">
              <Image
                isBlurred
                width={100}
                src="https://placehold.co/400x600/png"
                alt="NextUI Album Cover"
              />
            </div>

            <div className="">
              {assistant.model && (
                <p className="text-small text-default-400 truncate">
                  Model: {assistant.model.model}
                </p>
              )}
              {assistant.transcriber && (
                <p className="text-small text-default-400">
                  Transcriber: {assistant.transcriber.provider} / {assistant.transcriber.model}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
