import { TtsApi } from './types';

const xilabsApiDomain = process.env.ELEVENLABS_URL || '';
const apiKey = process.env.ELEVENLABS_API_KEY || '';

export const elevenlabsTts: TtsApi = async ({ text, referrerUrl, voiceId }) => {
  const xilabsUrl = `${xilabsApiDomain}/v1/text-to-speech/${voiceId}/stream`;

  const response = await fetch(xilabsUrl, {
    method: 'POST',
    body: JSON.stringify({
      model_id: 'eleven_turbo_v2',
      text: text,
    }),
    headers: {
      'Content-Type': 'application/json',
      'xi_api_key': apiKey,
      'X-DG-Referrer': referrerUrl,
    },
  });

  if (!response.ok || !response.body) {
    throw new Error('Unable to get response from API.');
  }

  return response;
};
