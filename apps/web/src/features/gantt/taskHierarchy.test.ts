import { describe, expect, it } from 'vitest';

import type { Task } from '../tasks/tasks.api';
import {
  countTaskDescendants,
  flattenVisibleTasks,
  indentTask,
  moveTask,
  outdentTask,
  recalculateParentTaskDates,
} from './taskHierarchy';

function task(
  id: string,
  parentId: string | null,
  orderIndex: number,
  level = 0,
  isCollapsed = false,
): Task {
  return {
    id,
    projectId: 'project',
    parentId,
    orderIndex,
    level,
    title: id,
    workType: null,
    assignee: 'Анна',
    estimate: null,
    duration: null,
    status: 'Ожидает',
    startDate: null,
    endDate: null,
    color: 'sage',
    isCollapsed,
    customFields: {},
    createdAt: `2026-01-0${orderIndex + 1}T00:00:00.000Z`,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('task hierarchy', () => {
  it('flattens siblings in order and hides collapsed descendants', () => {
    const tasks = [
      task('root-a', null, 0, 0, true),
      task('child', 'root-a', 0, 1),
      task('root-b', null, 1),
    ];

    expect(flattenVisibleTasks(tasks).map(({ id }) => id)).toEqual([
      'root-a',
      'root-b',
    ]);
    expect(countTaskDescendants(tasks, 'root-a')).toBe(1);
  });

  it('indents under the previous sibling and outdents after the parent', () => {
    const tasks = [task('a', null, 0), task('b', null, 1), task('c', null, 2)];
    const indented = indentTask(tasks, 'b');

    expect(indented?.find(({ id }) => id === 'b')).toMatchObject({
      parentId: 'a',
      orderIndex: 0,
      level: 1,
    });

    const outdented = outdentTask(indented ?? [], 'b');
    expect(
      flattenVisibleTasks(outdented ?? []).map(({ id }) => id),
    ).toEqual(['a', 'b', 'c']);
  });

  it('reorders vertically and can nest by horizontal intent', () => {
    const tasks = [task('a', null, 0), task('b', null, 1), task('c', null, 2)];
    const reordered = moveTask(tasks, 'a', 'c', 0);
    expect(flattenVisibleTasks(reordered ?? []).map(({ id }) => id)).toEqual([
      'b',
      'c',
      'a',
    ]);

    const nested = moveTask(tasks, 'c', 'a', 1);
    expect(nested?.find(({ id }) => id === 'c')).toMatchObject({
      parentId: 'a',
      level: 1,
    });
  });

  it('prevents cycles and a hierarchy deeper than five total levels', () => {
    const chain = [
      task('a', null, 0, 0),
      task('b', 'a', 0, 1),
      task('c', 'b', 0, 2),
      task('d', 'c', 0, 3),
      task('e', 'd', 0, 4),
      task('root', null, 1, 0),
    ];

    expect(moveTask(chain, 'a', 'c', 1)).toBeNull();
    expect(moveTask(chain, 'root', 'e', 1)).toBeNull();
  });

  it('recalculates parent dates from all nested task boundaries', () => {
    const tasks = [
      { ...task('root', null, 0), startDate: '2026-01-01', endDate: '2026-01-02' },
      { ...task('group', 'root', 0, 1), startDate: null, endDate: null },
      { ...task('child', 'group', 0, 2), startDate: '2026-02-10', endDate: '2026-02-14' },
      { ...task('sibling', 'root', 1, 1), startDate: '2026-02-01', endDate: null },
    ];

    const result = recalculateParentTaskDates(tasks);
    expect(result.find(({ id }) => id === 'group')).toMatchObject({
      startDate: '2026-02-10',
      endDate: '2026-02-14',
      duration: 5,
    });
    expect(result.find(({ id }) => id === 'root')).toMatchObject({
      startDate: '2026-02-01',
      endDate: '2026-02-14',
      duration: 14,
    });
  });
});
