export enum ActivityCategoryId {
  Game = 'game',
  Social = 'soc',
  Therapy = 'tx',
  Rehab = 'rehab',
}

export type ActivityCategory = {
  id: ActivityCategoryId;
  name?: string;
  icon?: string;
};
