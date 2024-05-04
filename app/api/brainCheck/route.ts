import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
//import { Message } from "ai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// export async function POST(req: NextRequest) {
export async function POST(req: Request) {
  const url = req.url;
  //const message: Message = await req.json();
  //const message = await req.json();
  const { messages } = await req.json();
  const start = Date.now();

  console.log('braincheck message', messages);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      stream: true,
      messages: messages,
      temperature:1,
      max_tokens:2150,
      top_p:1,
      frequency_penalty:0,
      presence_penalty:0
      //response_format={ "type": "json_object" },
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
