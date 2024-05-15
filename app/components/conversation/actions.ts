'use server';

import { promptData } from '@/app/api/brain/prompts';
import { extractIntroContent } from '@/app/lib/helpers';

export async function getPromptsOptions() {
  const items = Object.values(promptData).map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    intro: extractIntroContent(prompt.text),
  }));

  return items;
}
