import { Assistant } from '@vapi-ai/web/dist/api';

export const assistantsMockup = [
  {
    id: '1',
    name: 'Mock Assistant',
    model: {
      model: 'gpt-3.5-turbo',
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
    },
  },
] as Assistant[];
