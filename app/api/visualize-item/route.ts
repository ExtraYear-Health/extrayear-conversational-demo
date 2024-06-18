import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();
  const item: string = body.item; // e.g "crab", "shield", "pill", "boiling kettle"

  if (!item || item.length === 0 || item.length > 50) {
    return new NextResponse('Bad Request', {
      status: 400,
    });
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: `${item} in 3d style`,
      n: 1,
      size: '512x512',
    });

    const url = response.data[0].url;

    console.log('Generated Image', url);

    return NextResponse.json(
      {
        url,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return new NextResponse('Error processing the request', {
      status: 500,
    });
  }
}
