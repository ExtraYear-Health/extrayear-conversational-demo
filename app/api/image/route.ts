import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const data = await req.json();
  const prompt: string = data.prompt; // e.g "a white siamese cat"

  if (!prompt) {
    return new NextResponse('Bad Request', {
      status: 400,
    });
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const url = response.data[0].url;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return new NextResponse('Error processing the request', {
      status: 500,
    });
  }
}
