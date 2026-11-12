import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NonWorkingDay } from './non-working-days.api';
import { NonWorkingDaysDialog } from './NonWorkingDaysDialog';

const day: NonWorkingDay = {
  id: 'day-1',
  projectId: 'project-1',
  date: '2026-11-04',
  label: 'Праздник',
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
};

function renderDialog(days: NonWorkingDay[] = []) {
  const props = {
    days,
    projectStartDate: '2026-11-01',
    projectEndDate: '2026-11-30',
    isPending: false,
    onClose: vi.fn(),
    onAdd: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<NonWorkingDaysDialog {...props} />);
  return props;
}

describe('NonWorkingDaysDialog', () => {
  it('adds one named date inside the project period', () => {
    const { onAdd } = renderDialog();

    fireEvent.change(screen.getByLabelText('Дата начала'), { target: { value: '2026-11-04' } });
    fireEvent.change(screen.getByLabelText('Дата окончания'), { target: { value: '2026-11-04' } });
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: ' Праздник ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Добавить день' }).closest('form')!);

    expect(onAdd).toHaveBeenCalledWith([{ date: '2026-11-04', label: 'Праздник' }]);
  });

  it('adds an inclusive range and skips dates that are already marked', () => {
    const { onAdd } = renderDialog([day]);

    fireEvent.change(screen.getByLabelText('Дата начала'), { target: { value: '2026-11-03' } });
    fireEvent.change(screen.getByLabelText('Дата окончания'), { target: { value: '2026-11-05' } });
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Каникулы' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Добавить 2 дня' }).closest('form')!);

    expect(onAdd).toHaveBeenCalledWith([
      { date: '2026-11-03', label: 'Каникулы' },
      { date: '2026-11-05', label: 'Каникулы' },
    ]);
  });

  it('rejects a duplicate date and confirms deletion', () => {
    const { onAdd, onDelete } = renderDialog([day]);

    fireEvent.change(screen.getByLabelText('Дата начала'), { target: { value: day.date } });
    fireEvent.change(screen.getByLabelText('Дата окончания'), { target: { value: day.date } });
    fireEvent.submit(screen.getByRole('button', { name: 'Добавить день' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('уже отмечены');
    expect(onAdd).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Удалить 4 ноября/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).toHaveBeenCalledWith(day.id);
  });
});
