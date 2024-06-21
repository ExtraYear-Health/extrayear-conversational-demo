import { ActivityCategory, ActivityCategoryId } from '@/types';

const activityCategories: ActivityCategory[] = [
  {
    id: ActivityCategoryId.Game,
    name: 'Game',
    icon: 'dice-5',
  },
  {
    id: ActivityCategoryId.Therapy,
    name: 'Therapy',
    icon: 'book-heart',
  },
  {
    id: ActivityCategoryId.Social,
    name: 'Social',
    icon: 'speech',
  },
  {
    id: ActivityCategoryId.Rehab,
    name: 'Rehab',
    icon: 'book-heart',
  },
];

export const activityCategoriesMap = new Map(
  activityCategories.map((category) => [category.id, category])
);
