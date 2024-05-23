import { TtsApi } from './types';

const azureTtsUrl = `https://${process.env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const apiKey = process.env.AZURE_SUBSCRIPTION_KEY || '';

export const azureTts: TtsApi = async ({ text, voiceId }) => {
  const ssmlText = textToSsml({ voiceId, text }); // Convert text to SSML

  const response = await fetch(azureTtsUrl, {
    method: 'POST',
    body: ssmlText,
    headers: {
      'Content-Type': 'application/ssml+xml',
      'Ocp-Apim-Subscription-Key': apiKey,
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
    },
  });

  if (!response.ok || !response.body) {
    throw new Error('Unable to get response from API.');
  }

  return response;
};

function textToSsml({ voiceId, text }: any) {
  // Convert text to SSML
  const ssmlText = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${voiceId}">${text}</voice>
    </speak>`;
  return ssmlText;
}
