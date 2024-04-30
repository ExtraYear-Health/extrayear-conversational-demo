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




























// import OpenAI from "openai";
// import { OpenAIStream, StreamingTextResponse } from "ai";
// import { NextRequest, NextResponse } from "next/server";
// import { Message } from "ai";

// // Optional, but recommended: run on the edge runtime.
// // See https://vercel.com/docs/concepts/functions/edge-functions
// export const runtime = "edge";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// export async function POST(req: Request) {
//   // Extract the `messages` from the body of the request
//   const url = req.url;
//   const message: Message = await req.json();
//   const start = Date.now();

//   // Request the OpenAI API for the response based on the prompt
//   try {
//     const response = await openai.chat.completions.create({
//       //model: "gpt-4-0125-preview",
//       model: "gpt-4-turbo-preview",
//       //model: "gpt-3.5-turbo-16k-0613",
//       //stream: false,
//       messages: message,
//     });

//      // Assuming the response needs to be collected from the promise
//      const data = await response.data;  // Make sure you handle the promise correctly

//      // Optionally process data here if necessary
//      const simplifiedResponse = {
//        message: data.choices[0].message.content // Adjust based on actual structure of OpenAI's response
//      };
 
//      return new NextResponse(JSON.stringify(simplifiedResponse), {
//        status: 200, // HTTP status code
//        headers: {
//          "Content-Type": "application/json", // Ensure the content type is set to application/json
//          "X-LLM-Start": `${start}`,
//          "X-LLM-Response": `${Date.now()}`
//        }
//      });
//    } catch (error) {
//      console.error("Error fetching data from OpenAI", error);
//      return new NextResponse(JSON.stringify({ error: "Failed to fetch data" }), {
//        status: 500, // Server error
//        headers: {
//          "Content-Type": "application/json",
//        }
//      });
//    }
//  }