export type ProjectView = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  excludeNonWorkingDays: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectColumnView = {
  id: string;
  name: string;
  key: string;
  orderIndex: number;
  isVisible: boolean;
  isDefault: boolean;
};

export type ProjectDetailView = ProjectView & {
  columns: ProjectColumnView[];
};
