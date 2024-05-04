import { Response } from "node-fetch"; // Ensure this is the correct import path
import Groq from "groq-sdk"; // Assuming default export is available
import { NextRequest, NextResponse } from "next/server";
import { Message } from "ai";

// Optional, but recommended: run on the edge runtime.
export const runtime = "edge";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


export async function POST(req: Request) {
  // Extract the `chatMessages` from the body of the request
  const data = await req.json();
  const messages = data.messages;
  const model = data.llmModel;
  const temp = data.temperature;
  const maxTokens = data.maxTokens;
  const start = Date.now();
  
  console.log('groq api', model);

  //Initiate the chat completions with Groq
  try {
    const response = await groq.chat.completions.create({
      messages: messages,
      model: model,
      temperature: temp,
      max_tokens: maxTokens,
      top_p: 0.8,
      seed: 10,
      stop: null,//", 6",
      stream: false // Assuming streaming is not necessary
    });

    // Check response structure and serialize as needed
    const textResponse = JSON.stringify(response.choices[0]?.message?.content); // Convert the response to a JSON string if it's an object

    return new NextResponse(textResponse, {
      status: 200, // OK status
      headers: {
        "Content-Type": "application/json",
        "X-LLM-Start": `${start}`,
        "X-LLM-Response": `${Date.now()}`
      }
    });

  } catch (error: any) {
    console.error("Error processing the request:", error);
    return new NextResponse(error || error?.message, { status: 500 });
  }
}