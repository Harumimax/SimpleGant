import { describe, expect, it } from 'vitest';

import { recalculateParentDates } from './parent-task-dates.js';

const date = (value: string | null) =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

function task(
  id: string,
  parentId: string | null,
  startDate: string | null,
  endDate: string | null,
) {
  return { id, parentId, startDate: date(startDate), endDate: date(endDate) };
}

describe('parent task dates', () => {
  it('derives every parent range from nested descendants', () => {
    const result = recalculateParentDates([
      task('root', null, '2026-01-01', '2026-01-01'),
      task('group', 'root', null, null),
      task('first', 'group', '2026-02-03', '2026-02-05'),
      task('second', 'root', '2026-01-20', '2026-01-25'),
    ]);

    expect(result.find(({ id }) => id === 'group')).toMatchObject({
      startDate: date('2026-02-03'),
      endDate: date('2026-02-05'),
    });
    expect(result.find(({ id }) => id === 'root')).toMatchObject({
      startDate: date('2026-01-20'),
      endDate: date('2026-02-05'),
    });
  });

  it('uses all known boundaries and clears a parent with only undated children', () => {
    const result = recalculateParentDates([
      task('root', null, '2026-01-01', '2026-01-10'),
      task('start-only', 'root', '2026-03-10', null),
      task('end-only', 'root', null, '2026-03-05'),
      task('empty-parent', null, '2026-04-01', '2026-04-02'),
      task('empty-child', 'empty-parent', null, null),
    ]);

    expect(result.find(({ id }) => id === 'root')).toMatchObject({
      startDate: date('2026-03-05'),
      endDate: date('2026-03-10'),
    });
    expect(result.find(({ id }) => id === 'empty-parent')).toMatchObject({
      startDate: null,
      endDate: null,
    });
  });

  it('preserves dates when a task has no children', () => {
    const result = recalculateParentDates([
      task('leaf', null, '2026-05-01', '2026-05-04'),
    ]);

    expect(result[0]).toMatchObject({
      startDate: date('2026-05-01'),
      endDate: date('2026-05-04'),
    });
  });
});
