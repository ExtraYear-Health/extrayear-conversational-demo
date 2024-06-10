import { MessageRole } from '@/app/lib/conversation.type';
import { ChatMessage } from '@/app/components/conversation/Chat/useChatMessages';

export const chatMessagesMockup: ChatMessage[] = [
  {
    id: '1',
    role: MessageRole.ASSISTANT,
    content: 'Hello! **I\'m Devin.** How can I help you today?',
    timestamp: '2024-06-05T14:30:00.00-03:00',
  },
  {
    id: '2',
    role: MessageRole.USER,
    content: 'I need help with my mental health',
    timestamp: '2024-06-05T14:32:00.00-03:00',
  },
  {
    id: '3',
    role: MessageRole.ASSISTANT,
    content: 'I can help you with that. What are you feeling right now?',
    timestamp: '2024-06-05T14:33:00.00-03:00',
  },
  {
    id: '4',
    role: MessageRole.USER,
    content: 'I feel anxious and overwhelmed',
    timestamp: '2024-06-05T14:34:00.00-03:00',
  },
  {
    id: '5',
    role: MessageRole.ASSISTANT,
    content: 'I understand. Let’s start by taking a few deep breaths together. Inhale for 4 seconds, hold for 7 seconds, and exhale for 8 seconds. Repeat this 4-7-8 breathing exercise 4 times.',
    timestamp: '2024-06-05T14:35:00.00-03:00',
  },
  {
    id: '6',
    role: MessageRole.USER,
    content: 'Okay, I’ll try that',
    timestamp: '2024-06-05T14:36:00.00-03:00',
  },
  {
    id: '7',
    role: MessageRole.ASSISTANT,
    content: `![exercise](/ex-figures.png)`,
    timestamp: '2024-06-05T14:37:00.00-03:00',
  },
];
