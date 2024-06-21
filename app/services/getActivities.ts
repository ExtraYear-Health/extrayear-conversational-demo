'use server';

import { envConfig } from '@/config/envConfig.client';
import VapiClient from '@/lib/vapi/client';
import { activitiesMockup } from '@/mockup/activities';
import { Activity } from '@/types';

import { mapToActivity } from './mappers';

export async function getActivities(): Promise<Activity[]> {
  const response = await VapiClient.getAssistants();

  if (envConfig.enableMockups) {
    return activitiesMockup;
  }

  return response.map(mapToActivity);
}
