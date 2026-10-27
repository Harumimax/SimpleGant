import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from './tasks.api';
import type { ProjectColumn } from '../projects/projects.api';
import { TaskDialog } from './TaskDialog';

const parentTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Этап',
  workType: null,
  assignee: 'Ирина',
  estimate: null,
  status: 'Ожидает',
  startDate: '2026-11-01',
  endDate: '2026-11-10',
  color: 'sage',
  isCollapsed: false,
  customFields: {},
  createdAt: '2026-10-27T10:00:00.000Z',
  updatedAt: '2026-10-27T10:00:00.000Z',
};

const customColumn: ProjectColumn = {
  id: 'column-1',
  name: 'Бюджет',
  key: 'custom_budget',
  orderIndex: 5,
  isVisible: false,
  isDefault: false,
};

describe('TaskDialog', () => {
  it('submits required fields and one boundary date', () => {
    const onSubmit = vi.fn();
    render(<TaskDialog isPending={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Согласовать план' } });
    fireEvent.change(screen.getByLabelText('Ответственный'), { target: { value: 'Ирина' } });
    fireEvent.change(screen.getByLabelText('Начало задачи'), { target: { value: '2026-11-02' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Создать задачу' }).closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Согласовать план',
      assignee: 'Ирина',
      status: 'Ожидает',
      startDate: '2026-11-02',
      endDate: undefined,
      excludeWeekends: true,
    }));
  });

  it('rejects an end date earlier than the start date', () => {
    const onSubmit = vi.fn();
    render(<TaskDialog isPending={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Задача' } });
    fireEvent.change(screen.getByLabelText('Ответственный'), { target: { value: 'Ирина' } });
    fireEvent.change(screen.getByLabelText('Начало задачи'), { target: { value: '2026-11-10' } });
    fireEvent.change(screen.getByLabelText('Конец задачи'), { target: { value: '2026-11-01' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Создать задачу' }).closest('form')!);

    expect(screen.getByRole('alert')).toHaveTextContent('Дата окончания не может быть раньше даты начала');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables and omits dates when editing a parent task', () => {
    const onSubmit = vi.fn();
    render(
      <TaskDialog
        datesReadOnly
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        task={parentTask}
      />,
    );

    expect(screen.getByLabelText('Начало задачи')).toBeDisabled();
    expect(screen.getByLabelText('Конец задачи')).toBeDisabled();
    expect(screen.getByText(/рассчитываются автоматически/)).toBeInTheDocument();
    fireEvent.submit(screen.getByRole('button', { name: 'Сохранить задачу' }).closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ startDate: expect.anything() }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ endDate: expect.anything() }),
    );
  });

  it('submits text values for custom project columns, including hidden ones', () => {
    const onSubmit = vi.fn();
    render(
      <TaskDialog
        columns={[customColumn]}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Задача' } });
    fireEvent.change(screen.getByLabelText('Ответственный'), { target: { value: 'Ирина' } });
    fireEvent.change(screen.getByLabelText('Бюджет'), { target: { value: ' 150 000 ₽ ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Создать задачу' }).closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ customFields: { custom_budget: '150 000 ₽' } }),
    );
  });
});
