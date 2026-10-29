import { useRef, useState, type PointerEvent } from 'react';

import type { Task, TaskPeriod } from '../tasks/tasks.api';
import {
  calculateTaskBarGeometry,
  calculateTaskDateChange,
  calculateGanttRowDelta,
  GANTT_DAY_WIDTH,
  GANTT_ROW_HEIGHT,
  type TaskDateChangeMode,
  type TaskDateRange,
} from './timeline';

const TASK_BAR_COLORS = new Set([
  'sage',
  'blue',
  'sky',
  'lavender',
  'plum',
  'rose',
  'coral',
  'sand',
  'amber',
  'teal',
]);

type TaskBarProps = {
  task: Task;
  period?: TaskPeriod;
  timelineStartDate: string;
  timelineEndDate: string;
  dayWidth?: number;
  rowHeight?: number;
  onOpen: (task: Task) => void;
  onDateChange: (
    task: Task,
    periodId: string,
    dates: TaskDateRange,
  ) => Promise<void>;
  onVerticalMove?: (task: Task, rowDelta: number) => Promise<void>;
  onVerticalMoveStart?: (task: Task) => void;
  onVerticalMovePreview?: (task: Task, rowDelta: number) => number;
  onVerticalMoveCancel?: () => void;
  isSaving?: boolean;
  isDateLocked?: boolean;
  canChangeDates?: (periodId: string, dates: TaskDateRange) => boolean;
};

type Interaction = {
  pointerId: number;
  startX: number;
  startY: number;
  mode: TaskDateChangeMode;
  axis: 'horizontal' | 'vertical' | null;
};

const DRAG_ACTIVATION_DISTANCE = 6;

export function TaskBar({
  task,
  period,
  timelineStartDate,
  timelineEndDate,
  dayWidth = GANTT_DAY_WIDTH,
  rowHeight = GANTT_ROW_HEIGHT,
  onOpen,
  onDateChange,
  onVerticalMove,
  onVerticalMoveStart,
  onVerticalMovePreview,
  onVerticalMoveCancel,
  isSaving = false,
  isDateLocked = false,
  canChangeDates,
}: TaskBarProps) {
  const renderedPeriod = period ?? {
    id: task.id,
    title: task.title,
    startDate: task.startDate ?? '',
    endDate: task.endDate ?? '',
    includeInDuration: task.includeInDuration,
    color: TASK_BAR_COLORS.has(task.color) ? task.color as TaskPeriod['color'] : 'sage',
  };
  const interactionRef = useRef<Interaction | null>(null);
  const previewRef = useRef<TaskDateRange | null>(null);
  const didDragRef = useRef(false);
  const [preview, setPreview] = useState<TaskDateRange | null>(null);
  const [activeMode, setActiveMode] = useState<TaskDateChangeMode | null>(null);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const taskStartDate = renderedPeriod.startDate;
  const taskEndDate = renderedPeriod.endDate;
  const visibleStartDate = preview?.startDate ?? taskStartDate;
  const visibleEndDate = preview?.endDate ?? taskEndDate;
  const geometry = calculateTaskBarGeometry(
    visibleStartDate,
    visibleEndDate,
    timelineStartDate,
    timelineEndDate,
    dayWidth,
  );

  if (!geometry || !taskStartDate || !taskEndDate) return null;

  const originalStartDate = taskStartDate;
  const originalEndDate = taskEndDate;

  const startInset = geometry.isClippedStart ? 0 : 4;
  const endInset = geometry.isClippedEnd ? 0 : 4;
  const color = TASK_BAR_COLORS.has(renderedPeriod.color) ? renderedPeriod.color : 'sage';
  const periodLabel = `${visibleStartDate} — ${visibleEndDate}`;
  const barHeight = Math.max(8, Math.round(rowHeight * 0.64));
  const barPadding = rowHeight <= 13 ? 2 : rowHeight < GANTT_ROW_HEIGHT ? 6 : 10;
  const resizeHandleWidth = rowHeight <= 13 ? 5 : rowHeight < GANTT_ROW_HEIGHT ? 8 : 10;

  function startInteraction(
    event: PointerEvent<HTMLElement>,
    mode: TaskDateChangeMode,
  ) {
    if (
      isSaving ||
      event.button !== 0 ||
      (mode !== 'move' && isDateLocked)
    ) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      mode,
      axis: mode === 'move' ? null : 'horizontal',
    };
    previewRef.current = null;
    didDragRef.current = false;
    setPreview(null);
    setVerticalOffset(0);
    setActiveMode(mode === 'move' ? null : mode);
    if (mode === 'move') onVerticalMoveStart?.(task);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    if (!interaction.axis) {
      if (
        Math.max(Math.abs(deltaX), Math.abs(deltaY)) <
        DRAG_ACTIVATION_DISTANCE
      ) return;
      interaction.axis = Math.abs(deltaY) > Math.abs(deltaX)
        ? 'vertical'
        : 'horizontal';
      if (interaction.axis === 'horizontal' && !isDateLocked) {
        setActiveMode(interaction.mode);
      }
    }

    if (interaction.axis === 'vertical' && interaction.mode === 'move') {
      didDragRef.current = true;
      const rowDelta = calculateGanttRowDelta(deltaY, rowHeight);
      const visibleRowDelta = onVerticalMovePreview?.(task, rowDelta) ?? 0;
      setVerticalOffset(deltaY - visibleRowDelta * rowHeight);
      return;
    }
    if (isDateLocked) return;

    const dayDelta = Math.round(deltaX / dayWidth);
    const dates = calculateTaskDateChange(
      originalStartDate,
      originalEndDate,
      dayDelta,
      interaction.mode,
      timelineStartDate,
      timelineEndDate,
    );
    if (canChangeDates && !canChangeDates(renderedPeriod.id, dates)) return;
    didDragRef.current = dayDelta !== 0;
    previewRef.current = dates;
    setPreview(dates);
  }

  async function finishInteraction(event: PointerEvent<HTMLButtonElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    interactionRef.current = null;
    setActiveMode(null);
    setVerticalOffset(0);
    if (interaction.axis === 'vertical') {
      const rowDelta = calculateGanttRowDelta(
        event.clientY - interaction.startY,
        rowHeight,
      );
      if (rowDelta !== 0 && onVerticalMove) {
        try {
          await onVerticalMove(task, rowDelta);
        } catch {
          // The editor keeps the current structure and reports the error.
        }
      } else {
        onVerticalMoveCancel?.();
      }
      return;
    }
    onVerticalMoveCancel?.();
    const dates = previewRef.current;
    if (
      dates &&
      (dates.startDate !== originalStartDate ||
        dates.endDate !== originalEndDate)
    ) {
      try {
        await onDateChange(task, renderedPeriod.id, dates);
      } catch {
        // The editor reports the mutation error and restores the cached task.
      } finally {
        previewRef.current = null;
        setPreview(null);
      }
    } else {
      previewRef.current = null;
      setPreview(null);
    }
  }

  function cancelInteraction() {
    interactionRef.current = null;
    previewRef.current = null;
    didDragRef.current = false;
    setPreview(null);
    setActiveMode(null);
    setVerticalOffset(0);
    onVerticalMoveCancel?.();
  }

  return (
    <button
      aria-label={`Подробно: ${renderedPeriod.title}, ${periodLabel}${isDateLocked ? ', даты рассчитываются автоматически' : ''}`}
      aria-busy={isSaving || undefined}
      className={`gantt-task-bar group absolute flex items-center overflow-hidden text-left font-semibold shadow-sm outline-none transition-[filter,box-shadow,opacity] hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-70 ${verticalOffset ? 'z-30 cursor-grabbing opacity-80 shadow-lg' : 'z-[2]'} ${isDateLocked && !onVerticalMove ? 'cursor-pointer' : 'cursor-grab'}`}
      data-clipped-end={geometry.isClippedEnd || undefined}
      data-clipped-start={geometry.isClippedStart || undefined}
      data-color={color}
      data-dragging={verticalOffset ? 'vertical' : activeMode || undefined}
      disabled={isSaving}
      onClick={(event) => {
        if (didDragRef.current) {
          event.preventDefault();
          didDragRef.current = false;
          return;
        }
        onOpen(task);
      }}
      onPointerCancel={cancelInteraction}
      onPointerDown={(event) => startInteraction(event, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={finishInteraction}
      style={{
        fontSize: rowHeight <= 13 ? 0 : rowHeight < GANTT_ROW_HEIGHT ? 9 : 11,
        height: barHeight,
        left: geometry.left + startInset,
        paddingInline: barPadding,
        top: (rowHeight - barHeight) / 2,
        transform: verticalOffset ? `translateY(${verticalOffset}px)` : undefined,
        width: Math.max(geometry.width - startInset - endInset, 8),
      }}
      title={`${renderedPeriod.title}\n${periodLabel}${isDateLocked ? '\nДаты рассчитываются по вложенным задачам' : ''}`}
      type="button"
    >
      {!isDateLocked ? <span
        aria-hidden="true"
        className="gantt-task-resize-handle cursor-ew-resize"
        onPointerDown={(event) => startInteraction(event, 'resize-start')}
        style={{ flexBasis: resizeHandleWidth, marginLeft: -barPadding, width: resizeHandleWidth }}
      /> : null}
      {rowHeight > 13 ? <span className="min-w-0 flex-1 truncate text-center">
          {activeMode ? periodLabel : renderedPeriod.title}
        </span> : null}
      {!isDateLocked ? <span
        aria-hidden="true"
        className="gantt-task-resize-handle cursor-ew-resize"
        onPointerDown={(event) => startInteraction(event, 'resize-end')}
        style={{ flexBasis: resizeHandleWidth, marginRight: -barPadding, width: resizeHandleWidth }}
      /> : null}
    </button>
  );
}
