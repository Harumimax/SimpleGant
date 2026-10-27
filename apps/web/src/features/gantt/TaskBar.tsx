import { useRef, useState, type PointerEvent } from 'react';

import type { Task } from '../tasks/tasks.api';
import {
  calculateTaskBarGeometry,
  calculateTaskDateChange,
  GANTT_DAY_WIDTH,
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
  timelineStartDate: string;
  timelineEndDate: string;
  onOpen: (task: Task) => void;
  onDateChange: (
    task: Task,
    dates: TaskDateRange,
  ) => Promise<void>;
  isSaving?: boolean;
  isDateLocked?: boolean;
};

type Interaction = {
  pointerId: number;
  startX: number;
  mode: TaskDateChangeMode;
};

export function TaskBar({
  task,
  timelineStartDate,
  timelineEndDate,
  onOpen,
  onDateChange,
  isSaving = false,
  isDateLocked = false,
}: TaskBarProps) {
  const interactionRef = useRef<Interaction | null>(null);
  const previewRef = useRef<TaskDateRange | null>(null);
  const didDragRef = useRef(false);
  const [preview, setPreview] = useState<TaskDateRange | null>(null);
  const [activeMode, setActiveMode] = useState<TaskDateChangeMode | null>(null);
  const taskStartDate = task.startDate;
  const taskEndDate = task.endDate;
  const visibleStartDate = preview?.startDate ?? taskStartDate;
  const visibleEndDate = preview?.endDate ?? taskEndDate;
  const geometry = calculateTaskBarGeometry(
    visibleStartDate,
    visibleEndDate,
    timelineStartDate,
    timelineEndDate,
  );

  if (!geometry || !taskStartDate || !taskEndDate) return null;

  const originalStartDate = taskStartDate;
  const originalEndDate = taskEndDate;

  const startInset = geometry.isClippedStart ? 0 : 4;
  const endInset = geometry.isClippedEnd ? 0 : 4;
  const color = TASK_BAR_COLORS.has(task.color) ? task.color : 'sage';
  const period = `${visibleStartDate} — ${visibleEndDate}`;

  function startInteraction(
    event: PointerEvent<HTMLElement>,
    mode: TaskDateChangeMode,
  ) {
    if (isSaving || isDateLocked || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      mode,
    };
    previewRef.current = null;
    didDragRef.current = false;
    setPreview(null);
    setActiveMode(mode);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    const dayDelta = Math.round(
      (event.clientX - interaction.startX) / GANTT_DAY_WIDTH,
    );
    const dates = calculateTaskDateChange(
      originalStartDate,
      originalEndDate,
      dayDelta,
      interaction.mode,
      timelineStartDate,
      timelineEndDate,
    );
    didDragRef.current = dayDelta !== 0;
    previewRef.current = dates;
    setPreview(dates);
  }

  async function finishInteraction(event: PointerEvent<HTMLButtonElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    interactionRef.current = null;
    setActiveMode(null);
    const dates = previewRef.current;
    if (
      dates &&
      (dates.startDate !== originalStartDate ||
        dates.endDate !== originalEndDate)
    ) {
      try {
        await onDateChange(task, dates);
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
  }

  return (
    <button
      aria-label={`Подробно: ${task.title}, ${period}${isDateLocked ? ', даты рассчитываются автоматически' : ''}`}
      aria-busy={isSaving || undefined}
      className={`gantt-task-bar group absolute top-2 z-[2] flex h-7 items-center overflow-hidden px-2.5 text-left text-[11px] font-semibold shadow-sm outline-none transition-[filter,box-shadow,opacity] hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-70 ${isDateLocked ? 'cursor-pointer' : 'cursor-grab'}`}
      data-clipped-end={geometry.isClippedEnd || undefined}
      data-clipped-start={geometry.isClippedStart || undefined}
      data-color={color}
      data-dragging={activeMode || undefined}
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
        left: geometry.left + startInset,
        width: Math.max(geometry.width - startInset - endInset, 8),
      }}
      title={`${task.title}\n${period}${isDateLocked ? '\nДаты рассчитываются по вложенным задачам' : ''}`}
      type="button"
    >
      {!isDateLocked ? <span
        aria-hidden="true"
        className="gantt-task-resize-handle -ml-2.5 cursor-ew-resize"
        onPointerDown={(event) => startInteraction(event, 'resize-start')}
      /> : null}
      <span className="min-w-0 flex-1 truncate text-center">
        {activeMode ? period : task.title}
      </span>
      {!isDateLocked ? <span
        aria-hidden="true"
        className="gantt-task-resize-handle -mr-2.5 cursor-ew-resize"
        onPointerDown={(event) => startInteraction(event, 'resize-end')}
      /> : null}
    </button>
  );
}
