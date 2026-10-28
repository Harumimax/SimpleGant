import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { Task } from '../tasks/tasks.api';
import { TaskBar } from './TaskBar';

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Подготовить макет',
  workType: 'Дизайн',
  assignee: 'Анна',
  estimate: '3 дня',
  comment: null,
  duration: 3,
  status: 'В работе',
  startDate: '2026-11-03',
  endDate: '2026-11-05',
  color: 'sage',
  isCollapsed: false,
  customFields: {},
  createdAt: '2026-10-27T10:00:00.000Z',
  updatedAt: '2026-10-27T10:00:00.000Z',
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
});

describe('TaskBar', () => {
  it('positions the bar on its task dates and opens task details', () => {
    const onOpen = vi.fn();
    render(
      <TaskBar
        onDateChange={vi.fn().mockResolvedValue(undefined)}
        onOpen={onOpen}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button', { name: /Подготовить макет/ });
    expect(bar).toHaveStyle({ left: '76px', width: '100px' });
    expect(bar).toHaveAttribute('data-color', 'sage');

    fireEvent.click(bar);
    expect(onOpen).toHaveBeenCalledWith(task);
  });

  it('uses the default palette color for an unknown stored value', () => {
    render(
      <TaskBar
        onDateChange={vi.fn().mockResolvedValue(undefined)}
        onOpen={vi.fn()}
        task={{ ...task, color: 'unexpected' }}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-color', 'sage');
  });

  it('renders the color selected for the task', () => {
    render(
      <TaskBar
        onDateChange={vi.fn().mockResolvedValue(undefined)}
        onOpen={vi.fn()}
        task={{ ...task, color: 'teal' }}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-color', 'teal');
  });

  it('moves a task by whole calendar days and does not open details', async () => {
    const onDateChange = vi.fn().mockResolvedValue(undefined);
    const onOpen = vi.fn();
    render(
      <TaskBar
        onDateChange={onDateChange}
        onOpen={onOpen}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button');
    fireEvent.pointerDown(bar, { button: 0, clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 136, pointerId: 1 });
    expect(bar).toHaveTextContent('2026-11-04 — 2026-11-06');
    fireEvent.pointerUp(bar, { clientX: 136, pointerId: 1 });
    fireEvent.click(bar);

    await waitFor(() => {
      expect(onDateChange).toHaveBeenCalledWith(task, {
        startDate: '2026-11-04',
        endDate: '2026-11-06',
      });
    });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('uses the active scale width for geometry and horizontal dragging', async () => {
    const onDateChange = vi.fn().mockResolvedValue(undefined);
    render(
      <TaskBar
        dayWidth={14}
        onDateChange={onDateChange}
        onOpen={vi.fn()}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button');
    expect(bar).toHaveStyle({ left: '32px', width: '34px' });

    fireEvent.pointerDown(bar, { button: 0, clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 114, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientX: 114, pointerId: 1 });

    await waitFor(() => {
      expect(onDateChange).toHaveBeenCalledWith(task, {
        startDate: '2026-11-04',
        endDate: '2026-11-06',
      });
    });
  });

  it('moves a task vertically without changing its dates or opening details', async () => {
    const onDateChange = vi.fn().mockResolvedValue(undefined);
    const onVerticalMove = vi.fn().mockResolvedValue(undefined);
    const onOpen = vi.fn();
    render(
      <TaskBar
        onDateChange={onDateChange}
        onOpen={onOpen}
        onVerticalMove={onVerticalMove}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button');
    fireEvent.pointerDown(bar, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(bar, {
      clientX: 102,
      clientY: 144,
      pointerId: 1,
    });

    expect(bar).toHaveAttribute('data-dragging', 'vertical');
    expect(bar).toHaveStyle({ transform: 'translateY(44px)' });

    fireEvent.pointerUp(bar, {
      clientX: 102,
      clientY: 144,
      pointerId: 1,
    });
    fireEvent.click(bar);

    await waitFor(() => {
      expect(onVerticalMove).toHaveBeenCalledWith(task, 1);
    });
    expect(onDateChange).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('keeps the dragged bar under the pointer while rows adapt around it', () => {
    const onVerticalMovePreview = vi.fn().mockReturnValue(1);
    render(
      <TaskBar
        onDateChange={vi.fn().mockResolvedValue(undefined)}
        onOpen={vi.fn()}
        onVerticalMove={vi.fn().mockResolvedValue(undefined)}
        onVerticalMovePreview={onVerticalMovePreview}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button');
    fireEvent.pointerDown(bar, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(bar, {
      clientX: 100,
      clientY: 144,
      pointerId: 1,
    });

    expect(onVerticalMovePreview).toHaveBeenCalledWith(task, 1);
    expect(bar).not.toHaveStyle({ transform: 'translateY(44px)' });
  });

  it('allows a parent task with locked dates to move vertically', async () => {
    const onVerticalMove = vi.fn().mockResolvedValue(undefined);
    render(
      <TaskBar
        isDateLocked
        onDateChange={vi.fn().mockResolvedValue(undefined)}
        onOpen={vi.fn()}
        onVerticalMove={onVerticalMove}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button');
    fireEvent.pointerDown(bar, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(bar, {
      clientX: 100,
      clientY: 56,
      pointerId: 1,
    });
    fireEvent.pointerUp(bar, {
      clientX: 100,
      clientY: 56,
      pointerId: 1,
    });

    await waitFor(() => {
      expect(onVerticalMove).toHaveBeenCalledWith(task, -1);
    });
  });

  it('opens a parent task but does not allow dragging its derived dates', () => {
    const onDateChange = vi.fn().mockResolvedValue(undefined);
    const onOpen = vi.fn();
    render(
      <TaskBar
        isDateLocked
        onDateChange={onDateChange}
        onOpen={onOpen}
        task={task}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const bar = screen.getByRole('button', { name: /рассчитываются автоматически/ });
    fireEvent.pointerDown(bar, { button: 0, clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 136, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientX: 136, pointerId: 1 });
    fireEvent.click(bar);

    expect(onDateChange).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledWith(task);
  });
});
