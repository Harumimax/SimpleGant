import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from './tasks.api';
import { TaskDetailsDialog } from './TaskDetailsDialog';

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Задача с комментарием',
  workType: 'Разработка',
  assignee: '',
  estimate: null,
  comment: 'Первая строка\nВторая строка',
  duration: 3,
  status: 'Ожидает',
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  color: 'sage',
  isCollapsed: false,
  customFields: {},
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
};

describe('TaskDetailsDialog', () => {
  it('shows the task comment with preserved line breaks', () => {
    render(
      <TaskDetailsDialog
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        task={task}
      />,
    );

    const comment = screen.getByText((_, element) =>
      element?.tagName === 'DD' &&
      element.textContent === 'Первая строка\nВторая строка',
    );
    expect(comment).toHaveClass('whitespace-pre-wrap');
  });
});
