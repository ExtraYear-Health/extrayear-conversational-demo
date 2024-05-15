import OpenAI from 'openai';
import { Message, OpenAIStream, StreamingTextResponse } from 'ai';
import Mustache from 'mustache';

import { promptData } from './prompts';

import { systemContent } from '@/app/lib/constants';
import { generateRandomString } from '@/app/lib/helpers';

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const data = await req.json();

  const { messages, llmModel, temp, maxTokens, promptId, templateVars } = data;

  const start = Date.now();

  const instructionsPrompt = {
    id: generateRandomString(7),
    role: 'system',
    content: systemContent,
  } satisfies Message;

  const selectedPromptText = promptData[promptId].text;

  const topicPrompt = {
    id: generateRandomString(7),
    role: 'user',
    content: Mustache.render(selectedPromptText, {
      assistant_name: templateVars.assistantName,
    }),
  } satisfies Message;

  try {
    const response = await openai.chat.completions.create({
      model: llmModel,
      temperature: temp,
      max_tokens: maxTokens,
      stream: true,
      messages: [instructionsPrompt, topicPrompt, ...messages],
    });

    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream, {
      headers: {
        'X-LLM-Start': `${start}`,
        'X-LLM-Response': `${Date.now()}`,
      },
    });
  } catch (error) {
    console.error('test', error);
  }
}
