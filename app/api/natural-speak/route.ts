import { Message } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    // gotta use the request object to invalidate the cache every request :vomit:
    const url = req.url;

    // Parse the JSON body from the request
    const data = await req.json();
    const { message, voiceId } = data;

    // Start timer for latency measurement
    const start = Date.now();

    let text = message.content;

    text = text
        .replaceAll("¡", "")
        .replaceAll("https://", "")
        .replaceAll("http://", "")
        .replaceAll(".com", " dot com")
        .replaceAll(".org", " dot org")
        .replaceAll(".co.uk", " dot co dot UK")
        .replaceAll(/```[\s\S]*?```/g, "\nAs shown on the app.\n")
        .replaceAll(
        /([a-zA-Z0-9])\/([a-zA-Z0-9])/g,
        (match, precedingText, followingText) => {
            return precedingText + " forward slash " + followingText;
        }
        );

    // Build the URL for the external API request
    const xilabsUrl =  `${process.env.ELEVENLABS_URL}/v1/text-to-speech/${voiceId}/stream`;
    
    // Set up options for the fetch request
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi_api_key': process.env.ELEVENLABS_API_KEY,
            'X-DG-Referrer': url,
        },
        body: JSON.stringify({"model_id":"eleven_turbo_v2", "text":text }),
    };
    
    // Perform the fetch operation
    try {
      const response = await fetch(xilabsUrl, options);

      // Create custom headers for the response
      const headers = new Headers({
          "X-DG-Latency": `${Date.now() - start}`, // Calculate latency
          "Content-Type": "audio/mp3",
      });

      // Check if the response is successful and contains a body
      if (response.ok && response.body) {
          return new NextResponse(response.body, { headers });
      } else {
          // Handle errors such as no response body or unsuccessful HTTP status
          console.error('Failed to fetch audio from API:', response.statusText);
          return new NextResponse("Unable to get response from API.", { status: 500, headers });
      }
  } catch (error) {
      // Catch and log any errors in the fetch operation
      console.error('Error during fetch operation:', error);
      return new NextResponse(error.message || "Server error", { status: 500 });
  }
}
