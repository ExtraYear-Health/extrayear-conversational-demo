import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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

  console.log('openai api');

  // Request the OpenAI API for the response based on the prompt
  try {
    const response = await openai.chat.completions.create({
      model: model,
      temperature: temp,
      max_tokens: maxTokens,
      //model: "gpt-4-0125-preview",
      //model: "gpt-4-turbo",
      //model: "gpt-3.5-turbo-16k-0613",
      stream: true,
      messages: messages,
    });

    const stream = OpenAIStream(response);

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
