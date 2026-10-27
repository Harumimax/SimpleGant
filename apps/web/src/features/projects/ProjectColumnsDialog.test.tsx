import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProjectColumn } from './projects.api';
import { ProjectColumnsDialog } from './ProjectColumnsDialog';

const columns: ProjectColumn[] = [
  ['title', 'Название'],
  ['workType', 'Тип работ'],
  ['assignee', 'Исполнитель'],
  ['estimate', 'Оценка'],
  ['status', 'Статус'],
].map(([key, name], orderIndex) => ({
  id: `00000000-0000-4000-8000-00000000000${orderIndex}`,
  key: key!,
  name: name!,
  orderIndex,
  isVisible: true,
  isDefault: true,
}));

describe('ProjectColumnsDialog', () => {
  it('renames, hides, reorders and adds columns', () => {
    const onSubmit = vi.fn();
    render(
      <ProjectColumnsDialog
        columns={columns}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Название колонки 1'), {
      target: { value: 'Задача' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть колонку Оценка' }));
    fireEvent.click(screen.getByRole('button', { name: 'Поднять колонку Статус' }));
    fireEvent.click(screen.getByRole('button', { name: 'Добавить колонку' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Сохранить колонки' }).closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Задача', isVisible: true }),
      expect.objectContaining({ name: 'Тип работ' }),
      expect.objectContaining({ name: 'Исполнитель' }),
      expect.objectContaining({ name: 'Статус' }),
      expect.objectContaining({ name: 'Оценка', isVisible: false }),
      { name: 'Новая колонка 1', isVisible: true },
    ]);
  });

  it('does not allow deleting system columns or duplicate names', () => {
    const onSubmit = vi.fn();
    render(
      <ProjectColumnsDialog
        columns={columns}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: 'Удалить колонку Название' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Название колонки 2'), {
      target: { value: 'название' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Сохранить колонки' }).closest('form')!);

    expect(screen.getByRole('alert')).toHaveTextContent('Названия колонок не должны повторяться');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
