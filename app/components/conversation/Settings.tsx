'use client';

import { Select, SelectItem } from '@nextui-org/react';
import { useEffect } from 'react';

import { useActionState } from '../../lib/hooks/useActionState';
import { getAssistants } from './actions';
import { useConversation } from './context';

export function Settings() {
  const { assistantId, setAssistantId } = useConversation();

  const { data, dispatch, loading } = useActionState(getAssistants, []);

  useEffect(() => {
    dispatch();
  }, []);

  useEffect(() => {
    if (data) {
      setAssistantId('35325b69-34cd-4327-ba26-c276900506d3');
    }
  }, []);

  return (
    <main className="h-full overflow-hidden hidden">
      <Select
        isDisabled={loading}
        isLoading={loading}
        label="Assistant"
        onChange={(event) => setAssistantId(event.target.value)}
        selectedKeys={[assistantId]}
        placeholder="Select your assistant"
        value={assistantId}
      >
        {data.map((assistant) => (
          <SelectItem key={assistant.id} value={assistant.id} textValue={assistant.name}>
            <div className="flex flex-col gap-1">
              <span className="text-small">{assistant.name}</span>
              {assistant.model && <span className="text-tiny text-default-400">Model: {assistant.model.model}</span>}
              {assistant.transcriber && (
                <span className="text-tiny text-default-400">
                  Transcriber: {assistant.transcriber.provider} / {assistant.transcriber.model}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </Select>
    </main>
  );
}
