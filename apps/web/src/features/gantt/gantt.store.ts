import { create } from 'zustand';

import type { GanttAggregate } from './gantt.api';

type GanttDraftState = {
  projectId: string | null;
  aggregate: GanttAggregate | null;
  isDirty: boolean;
  revision: number;
  initialize: (aggregate: GanttAggregate) => void;
  update: (updater: (aggregate: GanttAggregate) => GanttAggregate) => void;
  markSaved: (aggregate: GanttAggregate, revision: number) => void;
  clear: () => void;
};

export const useGanttDraftStore = create<GanttDraftState>((set) => ({
  projectId: null,
  aggregate: null,
  isDirty: false,
  revision: 0,
  initialize: (aggregate) => set({
    projectId: aggregate.project.id,
    aggregate,
    isDirty: false,
    revision: 0,
  }),
  update: (updater) => set((state) => state.aggregate ? {
    aggregate: updater(state.aggregate),
    isDirty: true,
    revision: state.revision + 1,
  } : state),
  markSaved: (aggregate, savedRevision) => set((state) => {
    if (state.projectId !== aggregate.project.id || state.revision !== savedRevision) {
      return state;
    }
    return {
      projectId: aggregate.project.id,
      aggregate,
      isDirty: false,
    };
  }),
  clear: () => set({
    projectId: null,
    aggregate: null,
    isDirty: false,
    revision: 0,
  }),
}));
