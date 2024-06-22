'use server';

import { envConfig } from '@/config/envConfig.client';
import VapiClient from '@/lib/vapi/client';
import { activitiesMockup } from '@/mockup/activities';
import { Activity } from '@/types';

import { mapToActivity } from './mappers';

export async function getActivity(id: string): Promise<Activity> {
  const response = await VapiClient.getAssistant(id);

  if (envConfig.enableMockups) {
    return activitiesMockup.at(0);
  }

  return mapToActivity(response);
}
