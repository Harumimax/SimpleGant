import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskDialog } from './TaskDialog';

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
});
