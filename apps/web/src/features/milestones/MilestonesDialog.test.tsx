import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Milestone } from './milestones.api';
import { MilestonesDialog } from './MilestonesDialog';

const milestone: Milestone = {
  id: 'milestone-1',
  projectId: 'project-1',
  title: 'Релиз',
  date: '2026-11-20',
  color: 'coral',
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
};

function renderDialog(overrides: Partial<React.ComponentProps<typeof MilestonesDialog>> = {}) {
  const props = {
    milestones: [milestone],
    projectStartDate: '2026-11-01',
    projectEndDate: '2026-11-30',
    isPending: false,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<MilestonesDialog {...props} />);
  return props;
}

describe('MilestonesDialog', () => {
  it('creates a named milestone with a selected palette color', () => {
    const { onSave } = renderDialog({ milestones: [] });

    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Демо' } });
    fireEvent.change(screen.getByLabelText('Дата'), { target: { value: '2026-11-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Бирюзовый' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Добавить веху' }).closest('form')!);

    expect(onSave).toHaveBeenCalledWith({
      title: 'Демо',
      date: '2026-11-10',
      color: 'teal',
    }, undefined);
  });

  it('edits and confirms deletion of an existing milestone', () => {
    const { onSave, onDelete } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать Релиз' }));
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Запуск' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Сохранить веху' }).closest('form')!);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Запуск' }),
      milestone.id,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Релиз' }));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).toHaveBeenCalledWith(milestone.id);
  });
});
