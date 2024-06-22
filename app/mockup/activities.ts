import { activityCategoriesMap } from '@/constants/activityCategories';
import { therapistMap } from '@/constants/therapists';
import { Activity, ActivityCategoryId } from '@/types';

export const activitiesMockup: Activity[] = [
  {
    id: '1',
    name: 'Mockup 1',
    description: 'Mockup',
    therapist: therapistMap.get('1'),
    category: activityCategoriesMap.get(ActivityCategoryId.Game),
  },
  {
    id: '2',
    name: 'Mockup 2',
    description: 'Mockup',
    therapist: therapistMap.get('2'),
    category: activityCategoriesMap.get(ActivityCategoryId.Therapy),
  },
  {
    id: '3',
    name: 'Mockup 2',
    description: 'Mockup',
    therapist: therapistMap.get('3'),
    category: activityCategoriesMap.get(ActivityCategoryId.Social),
  },
];
