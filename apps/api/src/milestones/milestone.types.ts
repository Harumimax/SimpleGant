import type { MilestoneColor } from './milestone.constants.js';

export type MilestoneView = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  color: MilestoneColor;
  createdAt: Date;
  updatedAt: Date;
};
