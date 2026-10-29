import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProjectDialog } from './ProjectDialog';

describe('ProjectDialog', () => {
  it('submits a project with its required period', () => {
    const onSubmit = vi.fn();
    render(
      <ProjectDialog
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('Название')).toHaveFocus();

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'План запуска' },
    });
    fireEvent.change(screen.getByLabelText('Дата начала'), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText('Дата окончания'), {
      target: { value: '2027-01-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Создать проект' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'План запуска',
      startDate: '2026-11-01',
      endDate: '2027-01-31',
      excludeNonWorkingDays: true,
    });
  });

  it('does not submit an invalid period', () => {
    const onSubmit = vi.fn();
    render(
      <ProjectDialog
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'План запуска' },
    });
    fireEvent.change(screen.getByLabelText('Дата начала'), {
      target: { value: '2027-02-01' },
    });
    fireEvent.change(screen.getByLabelText('Дата окончания'), {
      target: { value: '2027-01-31' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Создать проект' }).closest('form')!);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Дата окончания не может быть раньше даты начала',
    );
    expect(screen.getByLabelText('Дата окончания')).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
