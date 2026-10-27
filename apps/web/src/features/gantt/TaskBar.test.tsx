import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from '../tasks/tasks.api';
import { TaskBar } from './TaskBar';

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Подготовить макет',
  workType: 'Дизайн',
  assignee: 'Анна',
  estimate: '3 дня',
  status: 'В работе',
  startDate: '2026-11-03',
  endDate: '2026-11-05',
  color: 'sage',
  isCollapsed: false,
  customFields: {},
  createdAt: '2026-10-27T10:00:00.000Z',
  updatedAt: '2026-10-27T10:00:00.000Z',
};

describe('TaskBar', () => {
  it('positions the bar on its task dates and opens task details', () => {
    const onOpen = vi.fn();
    render(
      <TaskBar
        onOpen={onOpen}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button', { name: /Подготовить макет/ });
    expect(bar).toHaveStyle({ left: '76px', width: '100px' });
    expect(bar).toHaveAttribute('data-color', 'sage');

    fireEvent.click(bar);
    expect(onOpen).toHaveBeenCalledWith(task);
  });

  it('uses the default palette color for an unknown stored value', () => {
    render(
      <TaskBar
        onOpen={vi.fn()}
        task={{ ...task, color: 'unexpected' }}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-color', 'sage');
  });
});
