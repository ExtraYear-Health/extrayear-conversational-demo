import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();
  const functionCall = body?.message?.functionCall;

  const prompt: string = functionCall?.parameters?.prompt; // e.g "a white siamese cat"

  console.log('message', prompt);

  if (!prompt) {
    return new NextResponse('Bad Request', {
      status: 400,
    });
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt,
      n: 1,
      size: '512x512',
    });

    const src = response.data[0].url;

    console.log('IMAGE GENERATED', src);

    return NextResponse.json(
      {
        result: {
          message: 'Here is the image!',
          prompt:
            "Don't speak the URL. Call SendImage function and pass src value as parameter and say you're displaying the image.",
          src: src,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return new NextResponse('Error processing the request', {
      status: 500,
    });
  }
}
