import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ProjectDetail } from '../projects/projects.api';
import type { Task } from '../tasks/tasks.api';
import { GanttWorkspace } from './GanttWorkspace';
import { flattenVisibleTasks } from './taskHierarchy';

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

function task(id: string, orderIndex: number): Task {
  return {
    id,
    projectId: project.id,
    parentId: null,
    orderIndex,
    level: 0,
    title: id === 'first' ? 'Первая задача' : 'Вторая задача',
    workType: 'Разработка',
    assignee: '',
    estimate: null,
    comment: null,
    duration: 3,
    status: 'Ожидает',
    startDate: '2026-11-03',
    endDate: '2026-11-05',
    color: 'sage',
    isCollapsed: false,
    customFields: {},
    createdAt: `2026-11-0${orderIndex + 1}T00:00:00.000Z`,
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
});

describe('GanttWorkspace', () => {
  it('does not show the save panel when the draft has no changes', () => {
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

    expect(screen.queryByRole('button', { name: 'Сохранить изменения' })).not.toBeInTheDocument();
    expect(screen.queryByText('Все изменения сохранены')).not.toBeInTheDocument();
    expect(screen.queryByText('Данные синхронизированы с сервером')).not.toBeInTheDocument();
  });

  it('switches between day, week and month timeline scales', () => {
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

    const daysButton = screen.getByRole('button', { name: 'Дни' });
    const weeksButton = screen.getByRole('button', { name: 'Недели' });
    const monthsButton = screen.getByRole('button', { name: 'Месяцы' });
    const timelineScroll = screen.getByRole('region', {
      name: 'Горизонтальная прокрутка временной шкалы',
    });
    const editor = screen.getByRole('region', {
      name: 'Редактор диаграммы Ганта',
    });

    expect(editor).toHaveClass('lg:flex');
    expect(editor).not.toHaveClass('md:flex');
    expect(screen.getByText(/требуется окно шириной не менее 1024 пикселей/i)).toBeInTheDocument();
    expect(daysButton).toHaveAttribute('aria-pressed', 'true');
    expect(timelineScroll.firstElementChild).toHaveAttribute('data-timeline-scale', 'days');
    expect(timelineScroll.firstElementChild).toHaveStyle({ width: '1080px' });

    fireEvent.click(weeksButton);
    expect(weeksButton).toHaveAttribute('aria-pressed', 'true');
    expect(daysButton).toHaveAttribute('aria-pressed', 'false');
    expect(timelineScroll.firstElementChild).toHaveAttribute('data-timeline-scale', 'weeks');
    expect(timelineScroll.firstElementChild).toHaveStyle({ width: '420px' });

    fireEvent.click(monthsButton);
    expect(monthsButton).toHaveAttribute('aria-pressed', 'true');
    expect(weeksButton).toHaveAttribute('aria-pressed', 'false');
    expect(timelineScroll.firstElementChild).toHaveAttribute('data-timeline-scale', 'months');
    expect(timelineScroll.firstElementChild).toHaveStyle({ width: '180px' });
  });

  it('shows automatic saving without an explicit save button', () => {
    render(
      <GanttWorkspace
        isDirty
        isSaving
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

    expect(screen.getByText('Сохраняем изменения…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сохранить изменения' })).not.toBeInTheDocument();
  });

  it('allows retrying a failed automatic save', () => {
    const onRetrySave = vi.fn();
    render(
      <GanttWorkspace
        isDirty
        milestones={[]}
        nonWorkingDays={[]}
        onAddTask={vi.fn()}
        onConfigureColumns={vi.fn()}
        onConfigureMilestones={vi.fn()}
        onConfigureNonWorkingDays={vi.fn()}
        onRetrySave={onRetrySave}
        onTaskDatesChange={vi.fn()}
        onTaskDetails={vi.fn()}
        onTaskOrderChange={vi.fn()}
        onToggleTaskCollapsed={vi.fn()}
        project={project}
        saveError="Не удалось сохранить изменения"
        tasks={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetrySave).toHaveBeenCalledOnce();
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
    expect(screen.queryByLabelText('Действия')).not.toBeInTheDocument();
    expect(taskPane.querySelector('.gantt-task-table')).toHaveStyle({
      minWidth: '232px',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Показать дополнительные колонки' }));

    expect(ganttShell).toHaveAttribute('data-columns-collapsed', 'false');
    expect(screen.getByText('Колонка 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Действия')).toBeInTheDocument();
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
        tasks={[task('non-working-day-task', 0)]}
      />,
    );

    const highlightedCells = screen.getAllByTitle('2026-11-04 — Праздник');
    expect(highlightedCells.length).toBeGreaterThan(1);
    expect(highlightedCells[0]).toHaveClass('bg-[var(--color-non-working)]');
  });

  it('reorders the linked task when its timeline bar moves vertically', async () => {
    const tasks = [task('first', 0), task('second', 1)];
    const onTaskOrderChange = vi.fn().mockResolvedValue(undefined);
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
        onTaskOrderChange={onTaskOrderChange}
        onToggleTaskCollapsed={vi.fn()}
        project={project}
        tasks={tasks}
      />,
    );

    const firstBar = screen.getByRole('button', {
      name: /Подробно: Первая задача,/,
    });
    fireEvent.pointerDown(firstBar, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(firstBar, {
      clientX: 101,
      clientY: 144,
      pointerId: 1,
    });

    const taskRows = screen.getByRole('region', { name: 'Таблица задач' })
      .querySelectorAll('[data-task-id]');
    expect(taskRows[0]).toHaveStyle({
      transform: 'translate3d(0, 44px, 0)',
    });
    expect(taskRows[1]).toHaveStyle({
      transform: 'translate3d(0, -44px, 0)',
    });

    const timelineRows = screen.getByRole('region', {
      name: 'Горизонтальная прокрутка временной шкалы',
    }).querySelectorAll('[data-task-id]');
    expect(timelineRows[0]).toHaveStyle({ transform: 'translateY(44px)' });
    expect(timelineRows[1]).toHaveStyle({ transform: 'translateY(-44px)' });

    fireEvent.pointerUp(firstBar, {
      clientX: 101,
      clientY: 144,
      pointerId: 1,
    });

    await waitFor(() => expect(onTaskOrderChange).toHaveBeenCalledOnce());
    const reordered = onTaskOrderChange.mock.calls[0]?.[0] as Task[];
    expect(flattenVisibleTasks(reordered).map(({ id }) => id)).toEqual([
      'second',
      'first',
    ]);
  });
});
