import { Therapist } from '@/types';

const therapists: Therapist[] = [
  {
    id: '1',
    name: 'Kevin',
    avatar: '/people/kevin.jpeg',
  },
  {
    id: '2',
    name: 'Charlene',
    avatar: '/people/charlene.jpeg',
  },
  {
    id: '3',
    name: 'Kai',
    avatar: '/people/kai.jpeg',
  },
  {
    id: '4',
    name: 'Michelle',
    avatar: '/people/michelle.jpeg',
  },
];

export const therapistMap = new Map(therapists.map((therapist) => [therapist.id, therapist]));
