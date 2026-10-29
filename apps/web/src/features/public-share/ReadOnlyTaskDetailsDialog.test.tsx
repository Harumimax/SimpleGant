import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from '../tasks/tasks.api';
import { ReadOnlyTaskDetailsDialog } from './ReadOnlyTaskDetailsDialog';

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Публичная задача',
  workType: null,
  assignee: '',
  estimate: null,
  comment: 'Комментарий для просмотра',
  duration: null,
  status: 'Ожидает',
  startDate: null,
  endDate: null,
  color: 'sage',
  includeInDuration: true,
  periods: [],
  isCollapsed: false,
  customFields: {},
  createdAt: '',
  updatedAt: '',
};

describe('ReadOnlyTaskDetailsDialog', () => {
  it('shows the task comment without edit controls', () => {
    render(
      <ReadOnlyTaskDetailsDialog
        columns={[]}
        onClose={vi.fn()}
        task={task}
      />,
    );

    expect(screen.getByText('Комментарий для просмотра')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Редактировать' })).not.toBeInTheDocument();
  });
});
