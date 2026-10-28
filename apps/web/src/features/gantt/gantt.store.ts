import { create } from 'zustand';

import type { GanttAggregate } from './gantt.api';

type GanttDraftState = {
  projectId: string | null;
  aggregate: GanttAggregate | null;
  isDirty: boolean;
  initialize: (aggregate: GanttAggregate) => void;
  update: (updater: (aggregate: GanttAggregate) => GanttAggregate) => void;
  markSaved: (aggregate: GanttAggregate) => void;
  clear: () => void;
};

export const useGanttDraftStore = create<GanttDraftState>((set) => ({
  projectId: null,
  aggregate: null,
  isDirty: false,
  initialize: (aggregate) => set({
    projectId: aggregate.project.id,
    aggregate,
    isDirty: false,
  }),
  update: (updater) => set((state) => state.aggregate ? {
    aggregate: updater(state.aggregate),
    isDirty: true,
  } : state),
  markSaved: (aggregate) => set({
    projectId: aggregate.project.id,
    aggregate,
    isDirty: false,
  }),
  clear: () => set({ projectId: null, aggregate: null, isDirty: false }),
}));
