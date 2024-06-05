'use client';

import { useEffect } from 'react';
import { Select, SelectItem } from '@nextui-org/react';

import { useActionState } from '../../lib/hooks/useActionState';

import { getAssistants } from './actions';

export interface SettingsProps {
  onSelectAssistant(id): void;
  assistantId?: string;
}

export function Settings({ assistantId, onSelectAssistant }: SettingsProps) {
  const { data, dispatch, loading } = useActionState(getAssistants, []);

  useEffect(() => {
    dispatch();
  }, []);

  return (
    <main className="h-full overflow-hidden">
      <Select
        isDisabled={loading}
        isLoading={loading}
        label="Assistant"
        onChange={(event) => onSelectAssistant(event.target.value)}
        placeholder="Select your assistant"
        value={assistantId}
      >
        {data.map((assistant) => (
          <SelectItem key={assistant.id} value={assistant.id} textValue={assistant.name}>
            <div className="flex flex-col gap-1">
              <span className="text-small">{assistant.name}</span>
              <span className="text-tiny text-default-400">Model: {assistant.model.model}</span>
              <span className="text-tiny text-default-400">Transcriber: {assistant.transcriber.provider} / {assistant.transcriber.model}</span>
            </div>
          </SelectItem>
        ))}
      </Select>
    </main>
  );
};
