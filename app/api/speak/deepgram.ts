import { TtsApi } from './types';

const deepgramApiDomain = process.env.DEEPGRAM_STT_DOMAIN || '';
const apiKey = process.env.DEEPGRAM_API_KEY || '';

export const deepgramTts: TtsApi = async ({ text, referrerUrl, model }) => {
  const deepgramTtsUrl = `${deepgramApiDomain}/v1/speak?model=${model}`;

  const response = await fetch(deepgramTtsUrl, {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: {
      'Content-Type': `application/json`,
      'Authorization': `token ${apiKey}`,
      'X-DG-Referrer': referrerUrl,
    },
  });

  if (!response.ok || !response.body) {
    throw new Error('Unable to get response from API.');
  }

  return response;
};
