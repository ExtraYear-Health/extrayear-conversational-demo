import { Assistant } from '@vapi-ai/web/dist/api';

import { activityCategoriesMap } from '@/constants/activityCategories';
import { therapistMap } from '@/constants/therapists';
import { Activity, ActivityCategory } from '@/types';
import { cleanName, grabId } from '@/utils/assistant';

export function mapToActivity(assistant: Assistant): Activity {
  const therapistId = grabId(assistant.name, 't');
  const categoryId = grabId(assistant.name, 'c');

  return {
    id: assistant.id,
    name: cleanName(assistant.name),
    description:
      'Paragraph that shows activity description that will expands to two lines of sentence.', // TODO: Add description
    therapist: therapistMap.get(therapistId),
    category: activityCategoriesMap.get(categoryId as ActivityCategory['id']),
  };
}
