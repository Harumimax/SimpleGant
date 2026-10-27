export const MILESTONE_COLORS = [
  'sage',
  'blue',
  'sky',
  'lavender',
  'plum',
  'rose',
  'coral',
  'sand',
  'amber',
  'teal',
] as const;

export const DEFAULT_MILESTONE_COLOR = 'coral';
export type MilestoneColor = (typeof MILESTONE_COLORS)[number];
