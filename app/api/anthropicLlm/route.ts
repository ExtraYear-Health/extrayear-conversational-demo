import Anthropic from '@anthropic-ai/sdk';
// import { anthropic } from '@ai-sdk/anthropic'
import { AnthropicStream, StreamingTextResponse } from "ai";
// import { AnthropicStream } from "ai"


// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = "edge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});


export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const data = await req.json();
  const messages = data.messages;
  const model = data.llmModel;
  const temp = data.temperature;
  const maxTokens = data.maxTokens;
  // const { messages } = await req.json();
  const start = Date.now();

  console.log('claude api', model);

  // Request the OpenAI API for the response based on the prompt
  try {
    const response = await anthropic.messages.create({
      model: model,
      temperature: temp,
      max_tokens: maxTokens,
      stream: true,
      messages: messages,
    });

    const stream = AnthropicStream(response);

    return new StreamingTextResponse(stream, {
      headers: {
        "X-LLM-Start": `${start}`,
        "X-LLM-Response": `${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("test", error);
  }
}
