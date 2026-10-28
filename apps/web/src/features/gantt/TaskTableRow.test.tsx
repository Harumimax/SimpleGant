import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProjectColumn } from '../projects/projects.api';
import type { Task } from '../tasks/tasks.api';
import { TaskTableRow } from './TaskTableRow';

const titleColumn: ProjectColumn = {
  id: 'column-title',
  name: 'Название',
  key: 'title',
  orderIndex: 0,
  isVisible: true,
  isDefault: true,
};

const durationColumn: ProjectColumn = {
  ...titleColumn,
  id: 'column-duration',
  name: 'Длительность',
  key: 'duration',
  orderIndex: 1,
};

const assigneeColumn: ProjectColumn = {
  ...titleColumn,
  id: 'column-assignee',
  name: 'Исполнитель',
  key: 'assignee',
  orderIndex: 1,
};

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Подготовить прототип',
  workType: '',
  assignee: 'Максим',
  estimate: '',
  comment: null,
  duration: 12,
  status: 'Ожидает',
  startDate: '2026-10-19',
  endDate: '2026-10-30',
  color: 'sage',
  isCollapsed: false,
  customFields: {},
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
};

describe('TaskTableRow', () => {
  it('opens task details when the task title is clicked', () => {
    const onDetails = vi.fn();

    render(
      <TaskTableRow
        canIndent={false}
        canOutdent={false}
        columns={[titleColumn]}
        gridTemplateColumns="42px minmax(190px, 2fr) 96px"
        hasChildren={false}
        onDetails={onDetails}
        onIndent={vi.fn()}
        onOutdent={vi.fn()}
        onToggleCollapsed={vi.fn()}
        rowNumber={1}
        task={task}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: task.title }));

    expect(onDetails).toHaveBeenCalledOnce();
    expect(onDetails).toHaveBeenCalledWith(task);
  });

  it('renders duration derived from the task dates', () => {
    render(
      <TaskTableRow
        canIndent={false}
        canOutdent={false}
        columns={[titleColumn, durationColumn]}
        gridTemplateColumns="42px minmax(190px, 2fr) 104px 96px"
        hasChildren={false}
        onDetails={vi.fn()}
        onIndent={vi.fn()}
        onOutdent={vi.fn()}
        onToggleCollapsed={vi.fn()}
        rowNumber={1}
        task={task}
      />,
    );

    expect(screen.getByText('12 дн.')).toBeInTheDocument();
  });

  it('renders a dash when the task has no assignee', () => {
    render(
      <TaskTableRow
        canIndent={false}
        canOutdent={false}
        columns={[titleColumn, assigneeColumn]}
        gridTemplateColumns="42px minmax(190px, 2fr) 104px 96px"
        hasChildren={false}
        onDetails={vi.fn()}
        onIndent={vi.fn()}
        onOutdent={vi.fn()}
        onToggleCollapsed={vi.fn()}
        rowNumber={1}
        task={{ ...task, assignee: '' }}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
