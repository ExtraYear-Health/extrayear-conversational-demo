import { Assistant } from '@vapi-ai/web/dist/api';

export const assistantsMockup = [
  {
    id: '1',
    name: 'Mock Assistant',
    model: {
      model: 'mock',
    },
    transcriber: {
      provider: 'deepgram',
      model: 'mock',
    },
  },
] as Assistant[];
