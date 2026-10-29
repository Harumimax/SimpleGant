import { describe, expect, it } from 'vitest';

import type { Task } from '../tasks/tasks.api';
import { canUsePeriodDates, taskDateBounds, taskPeriodsDuration } from './taskPeriods';

const task: Task = {
  id: 'task-1', projectId: 'project-1', parentId: null, orderIndex: 0, level: 0,
  title: 'Разработка', workType: 'Разработка', assignee: '', estimate: null,
  comment: null, duration: 10, status: 'В работе', startDate: '2026-11-02',
  endDate: '2026-11-06', color: 'sage', includeInDuration: true,
  periods: [{
    id: 'period-2', title: 'Отпуск', startDate: '2026-11-09',
    endDate: '2026-11-13', includeInDuration: false, color: 'sand',
  }, {
    id: 'period-3', title: 'Доработка', startDate: '2026-11-16',
    endDate: '2026-11-20', includeInDuration: true, color: 'blue',
  }],
  isCollapsed: false, customFields: {}, createdAt: '', updatedAt: '',
};

describe('taskPeriods', () => {
  it('derives bounds and included duration across all bars', () => {
    expect(taskDateBounds(task)).toEqual({
      startDate: '2026-11-02',
      endDate: '2026-11-20',
    });
    expect(taskPeriodsDuration(task, true, [])).toBe(10);
  });

  it('prevents overlap and crossing adjacent periods', () => {
    expect(canUsePeriodDates(task, 'period-2', '2026-11-07', '2026-11-15')).toBe(true);
    expect(canUsePeriodDates(task, 'period-2', '2026-11-06', '2026-11-12')).toBe(false);
    expect(canUsePeriodDates(task, 'period-2', '2026-11-21', '2026-11-25')).toBe(false);
  });
});
