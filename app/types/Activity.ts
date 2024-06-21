import { ActivityCategory } from './ActivityCategory';
import { Therapist } from './Therapist';

export type Activity = {
  id: string;
  category?: ActivityCategory;
  description?: string;
  name?: string;
  therapist?: Therapist;
};
