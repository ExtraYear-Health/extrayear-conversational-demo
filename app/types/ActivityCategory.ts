export enum ActivityCategoryId {
  Game = 'g',
  Social = 'sc',
  Therapy = 'tx',
}

export type ActivityCategory = {
  id: ActivityCategoryId;
  name?: string;
  icon?: string;
};
