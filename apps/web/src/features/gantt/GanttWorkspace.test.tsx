import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProjectDetail } from '../projects/projects.api';
import { GanttWorkspace } from './GanttWorkspace';

const project: ProjectDetail = {
  id: 'project-1',
  name: 'Большой проект',
  startDate: '2026-11-01',
  endDate: '2026-11-30',
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
  columns: Array.from({ length: 10 }, (_, index) => ({
    id: `column-${index}`,
    name: index === 0 ? 'Название' : `Колонка ${index + 1}`,
    key: index === 0 ? 'title' : `column_${index}`,
    orderIndex: index,
    isVisible: true,
    isDefault: index < 5,
  })),
};

describe('GanttWorkspace', () => {
  it('shows and triggers explicit saving for a dirty draft', () => {
    const onSave = vi.fn();
    render(
      <GanttWorkspace
        isDirty
        milestones={[]}
        nonWorkingDays={[]}
        onAddTask={vi.fn()}
        onConfigureColumns={vi.fn()}
        onConfigureMilestones={vi.fn()}
        onConfigureNonWorkingDays={vi.fn()}
        onSave={onSave}
        onTaskDatesChange={vi.fn()}
        onTaskDetails={vi.fn()}
        onTaskOrderChange={vi.fn()}
        onToggleTaskCollapsed={vi.fn()}
        project={project}
        tasks={[]}
      />,
    );

    expect(screen.getByText('Есть несохранённые изменения')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('makes a wide task table horizontally scrollable when many columns are visible', () => {
    render(
      <GanttWorkspace
        milestones={[]}
        nonWorkingDays={[]}
        onAddTask={vi.fn()}
        onConfigureColumns={vi.fn()}
        onConfigureMilestones={vi.fn()}
        onConfigureNonWorkingDays={vi.fn()}
        onTaskDatesChange={vi.fn()}
        onTaskDetails={vi.fn()}
        onTaskOrderChange={vi.fn()}
        onToggleTaskCollapsed={vi.fn()}
        project={project}
        tasks={[]}
      />,
    );

    const taskPane = screen.getByRole('region', { name: 'Таблица задач' });
    expect(taskPane).toHaveClass('gantt-task-pane');
    expect(taskPane).toHaveAttribute('tabindex', '0');
    expect(taskPane.querySelector('.gantt-task-table')).toHaveStyle({
      minWidth: '1264px',
    });
  });

  it('hides every task column except the title and restores them on demand', () => {
    render(
      <GanttWorkspace
        milestones={[]}
        nonWorkingDays={[]}
        onAddTask={vi.fn()}
        onConfigureColumns={vi.fn()}
        onConfigureMilestones={vi.fn()}
        onConfigureNonWorkingDays={vi.fn()}
        onTaskDatesChange={vi.fn()}
        onTaskDetails={vi.fn()}
        onTaskOrderChange={vi.fn()}
        onToggleTaskCollapsed={vi.fn()}
        project={project}
        tasks={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть дополнительные колонки' }));

    const taskPane = screen.getByRole('region', { name: 'Таблица задач' });
    const ganttShell = taskPane.parentElement;
    expect(ganttShell).toHaveAttribute('data-columns-collapsed', 'true');
    expect(screen.getByText('Название')).toBeInTheDocument();
    expect(screen.queryByText('Колонка 2')).not.toBeInTheDocument();
    expect(taskPane.querySelector('.gantt-task-table')).toHaveStyle({
      minWidth: '328px',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Показать дополнительные колонки' }));

    expect(ganttShell).toHaveAttribute('data-columns-collapsed', 'false');
    expect(screen.getByText('Колонка 2')).toBeInTheDocument();
    expect(taskPane.querySelector('.gantt-task-table')).toHaveStyle({
      minWidth: '1264px',
    });
  });

  it('highlights project non-working days across the timeline', () => {
    render(
      <GanttWorkspace
        milestones={[]}
        nonWorkingDays={[{
          id: 'day-1',
          projectId: project.id,
          date: '2026-11-04',
          label: 'Праздник',
          createdAt: '2026-10-28T00:00:00.000Z',
          updatedAt: '2026-10-28T00:00:00.000Z',
        }]}
        onAddTask={vi.fn()}
        onConfigureColumns={vi.fn()}
        onConfigureMilestones={vi.fn()}
        onConfigureNonWorkingDays={vi.fn()}
        onTaskDatesChange={vi.fn()}
        onTaskDetails={vi.fn()}
        onTaskOrderChange={vi.fn()}
        onToggleTaskCollapsed={vi.fn()}
        project={project}
        tasks={[]}
      />,
    );

    const highlightedCells = screen.getAllByTitle('2026-11-04 — Праздник');
    expect(highlightedCells.length).toBeGreaterThan(1);
    expect(highlightedCells[0]).toHaveClass('bg-[var(--color-non-working)]');
  });
});
