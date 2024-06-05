'use server';

import { Assistant } from '@vapi-ai/web/dist/api';
import { Client } from 'undici';

const vapiKey = process.env.VAPI_PRIVATE_API_KEY;
const vapiClient = new Client('https://api.vapi.ai');

const headers = {
  Authorization: `Bearer ${vapiKey}`,
};

export async function getAssistants() {
  const response = await vapiClient.request({
    path: '/assistant',
    method: 'GET',
    headers,
  });

  const data = await response.body.json() as Assistant[];

  return data.map(({ id, name, transcriber, model }) => ({
    id,
    name,
    model,
    transcriber,
  }));
}

export async function getAssistant(id: string) {
  const response = await vapiClient.request({
    path: `/assistant/${id}`,
    method: 'GET',
    headers,
  });

  const data = await response.body.json();

  return data;
}
