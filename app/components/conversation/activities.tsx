'use client';

import { Tab, Tabs } from '@nextui-org/react';
import { useMemo, useState } from 'react';

import { ActivityCard } from '@/components/ui/activity-card';
import { activityCategoriesMap } from '@/constants/activityCategories';
import { ActivityCategoryId } from '@/types';

import { useConversation } from './context';

export function Activities() {
  const { activityId, setActivityId } = useConversation();

  const [tab, selectedTab] = useState<ActivityCategoryId | 'all'>('all');

  const { activities } = useConversation();

  const cards = useMemo(() => {
    if (!tab || tab === 'all') {
      return activities;
    }
    return activities.filter(({ category }) => category.id === tab);
  }, [tab, activities]);

  return (
    <div className="mt-2">
      <div className="max-w-full overflow-x-auto py-2">
        <Tabs
          selectedKey={tab}
          onSelectionChange={(value) => {
            setActivityId(undefined);
            selectedTab(value as ActivityCategoryId);
          }}
        >
          <Tab key="all" title="All activity" />
          {Array.from(activityCategoriesMap.values()).map((category) => (
            <Tab key={category.id} title={category.name} />
          ))}
        </Tabs>
      </div>

      <div className="overflow-auto py-5 max-w-full">
        <div className="flex gap-2 md:gap-3 flex-nowrap">
          {cards.map((activity) => (
            <ActivityCard
              selected={activityId === activity.id}
              key={activity.id}
              category={activity.category?.name}
              title={activity.name}
              icon={activity.category?.icon}
              therapistName={activity.therapist?.name}
              avatarUrl={activity.therapist?.avatar}
              description={activity.description}
              onClick={(event) => {
                event.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                });
                setActivityId(activity.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
