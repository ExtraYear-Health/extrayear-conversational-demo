import type { Meta, StoryObj } from '@storybook/react';

import { ActivityCard } from './activity-card';

const meta = {
  title: 'Components/ActivityCard',
  component: ActivityCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'Memorizing grocery list',
    therapistName: 'Kevin',
    icon: 'dice-5',
    category: 'Game',
    avatarUrl: '/people/kevin.jpeg',
    description: 'A game to help you memorize your grocery list',
  },
};
