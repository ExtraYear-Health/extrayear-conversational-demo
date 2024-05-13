import { Message } from "ai";
import { NextRequest, NextResponse, userAgent } from "next/server";

export async function POST(req: NextRequest) {
    // Parse the JSON body from the request
    const data = await req.json();
    const { message, voiceId } = data;
    //const voiceId = "en-US-AvaMultilingualNeural";

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
        .replaceAll(/([a-zA-Z0-9])\/([a-zA-Z0-9])/g, (match, precedingText, followingText) => {
            return precedingText + " forward slash " + followingText;
        });

    // Build the URL for the external API request
    const azureTtsUrl = `https://${process.env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // Convert text to SSML
    const ssmlText = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${voiceId}">${text}</voice>
    </speak>`;

    
    // Set up options for the fetch request
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/ssml+xml',
            'Ocp-Apim-Subscription-Key': process.env.AZURE_SUBSCRIPTION_KEY,
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        },
        body: ssmlText,//JSON.stringify(ssmlText),
    };
    
    // Perform the fetch operation
    try {
        const response = await fetch(azureTtsUrl, options);

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