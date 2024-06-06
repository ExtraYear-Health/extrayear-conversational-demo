'use server';

import { Assistant } from '@vapi-ai/web/dist/api';
import { Client } from 'undici';

import { assistantsMockup } from './assistants.mockup';

import { envConfig } from '@/app/config/envConfig.client';

const vapiKey = process.env.VAPI_PRIVATE_API_KEY;
const vapiClient = new Client('https://api.vapi.ai');

const headers = {
  Authorization: `Bearer ${vapiKey}`,
};

export async function getAssistants() {
  if (envConfig.enableMockups) {
    return assistantsMockup;
  }

  const response = await vapiClient.request({
    path: '/assistant',
    method: 'GET',
    headers,
  });

  const data = await response.body.json() as Assistant[];

  return data;
}

export async function getAssistant(id: string) {
  if (envConfig.enableMockups) {
    return assistantsMockup.at(0);
  }

  const response = await vapiClient.request({
    path: `/assistant/${id}`,
    method: 'GET',
    headers,
  });

  const data = await response.body.json() as Assistant;

  return data;
}
