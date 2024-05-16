import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import Mustache from 'mustache';
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/index.mjs';

import { promptData } from './prompts';

import { systemContent } from '@/app/lib/constants';
import { generateRandomString } from '@/app/lib/helpers';

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const data = await req.json();
  const { messages: dataMessages, llmModel, temperature, maxTokens, promptId, templateVars, llmProvider } = data;

  const start = Date.now();

  const instructionsPrompt = {
    name: generateRandomString(7),
    role: 'system',
    content: systemContent,
  } satisfies ChatCompletionSystemMessageParam;

  const selectedPromptText = promptData[promptId].text;

  const topicPrompt = {
    name: generateRandomString(7),
    role: 'user',
    content: Mustache.render(selectedPromptText, {
      assistant_name: templateVars.assistantName,
    }),
  } satisfies ChatCompletionUserMessageParam;

  const messages = [instructionsPrompt, topicPrompt, ...dataMessages];

  console.log('LLM in use:', llmModel);

  try {
    if (llmProvider === 'meta') {
      const response = await groq.chat.completions.create({
        messages,
        model: llmModel,
        temperature,
        max_tokens: maxTokens,
        top_p: 0.8,
        seed: 10,
        stop: null, // ", 6",
        stream: false, // Assuming streaming is not necessary
      });

      // Check response structure and serialize as needed
      const textResponse = JSON.stringify(response.choices[0]?.message?.content); // Convert the response to a JSON string if it's an object

      return new NextResponse(textResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-LLM-Start': `${start}`,
          'X-LLM-Response': `${Date.now()}`,
        },
      });
    }

    if (llmProvider === 'openai') {
      const response = await openai.chat.completions.create({
        model: llmModel,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        messages,
      });

      const stream = OpenAIStream(response);

      return new StreamingTextResponse(stream, {
        headers: {
          'X-LLM-Start': `${start}`,
          'X-LLM-Response': `${Date.now()}`,
        },
      });
    }
  } catch (error) {
    console.error('Error processing the request:', error);
    return new NextResponse(error || error?.message, {
      status: 500,
    });
  }
}
