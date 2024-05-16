'use server';

import mustache from 'mustache';

import { promptData } from '@/app/api/brain/prompts';
import { extractIntroContent } from '@/app/lib/helpers';

export async function getPromptsOptions() {
  const items = Object.values(promptData).map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
  }));

  return items;
}

export async function getIntroMessage(
  promptId: string,
  { assistantName }: { assistantName: string; },
) {
  const promptConfig = promptData[promptId];
  const intro = extractIntroContent(promptConfig.text);
  return mustache.render(intro, {
    assistant_name: assistantName,
  });
}
