import { beforeEach, describe, expect, it } from 'vitest';

import type { GanttAggregate } from './gantt.api';
import { useGanttDraftStore } from './gantt.store';

const aggregate: GanttAggregate = {
  project: {
    id: 'project-1',
    name: 'Проект',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    createdAt: '2026-10-28T00:00:00.000Z',
    updatedAt: '2026-10-28T00:00:00.000Z',
    columns: [],
  },
  tasks: [],
  milestones: [],
  nonWorkingDays: [],
};

describe('useGanttDraftStore', () => {
  beforeEach(() => useGanttDraftStore.getState().clear());

  it('marks local updates dirty and clears dirty state after save', () => {
    useGanttDraftStore.getState().initialize(aggregate);
    expect(useGanttDraftStore.getState().isDirty).toBe(false);

    useGanttDraftStore.getState().update((current) => ({
      ...current,
      project: { ...current.project, name: 'Черновик' },
    }));
    expect(useGanttDraftStore.getState().aggregate?.project.name).toBe('Черновик');
    expect(useGanttDraftStore.getState().isDirty).toBe(true);

    const revision = useGanttDraftStore.getState().revision;
    useGanttDraftStore.getState().markSaved(aggregate, revision);
    expect(useGanttDraftStore.getState().isDirty).toBe(false);
    expect(useGanttDraftStore.getState().aggregate?.project.name).toBe('Проект');
  });

  it('does not replace a newer draft with an older save response', () => {
    useGanttDraftStore.getState().initialize(aggregate);
    useGanttDraftStore.getState().update((current) => ({
      ...current,
      project: { ...current.project, name: 'Первая версия' },
    }));
    const savingRevision = useGanttDraftStore.getState().revision;

    useGanttDraftStore.getState().update((current) => ({
      ...current,
      project: { ...current.project, name: 'Новая версия' },
    }));
    useGanttDraftStore.getState().markSaved(aggregate, savingRevision);

    expect(useGanttDraftStore.getState().isDirty).toBe(true);
    expect(useGanttDraftStore.getState().aggregate?.project.name).toBe('Новая версия');
  });
});
