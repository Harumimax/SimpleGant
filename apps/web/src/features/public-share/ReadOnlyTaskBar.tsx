import type { Task } from '../tasks/tasks.api';
import {
  calculateTaskBarGeometry,
  GANTT_DAY_WIDTH,
  GANTT_ROW_HEIGHT,
} from '../gantt/timeline';

const TASK_BAR_COLORS = new Set([
  'sage', 'blue', 'sky', 'lavender', 'plum',
  'rose', 'coral', 'sand', 'amber', 'teal',
]);

type Props = {
  task: Task;
  timelineStartDate: string;
  timelineEndDate: string;
  dayWidth?: number;
  rowHeight?: number;
  onOpen: (task: Task) => void;
};

export function ReadOnlyTaskBar({
  task,
  timelineStartDate,
  timelineEndDate,
  dayWidth = GANTT_DAY_WIDTH,
  rowHeight = GANTT_ROW_HEIGHT,
  onOpen,
}: Props) {
  const geometry = calculateTaskBarGeometry(
    task.startDate,
    task.endDate,
    timelineStartDate,
    timelineEndDate,
    dayWidth,
  );
  if (!geometry || !task.startDate || !task.endDate) return null;
  const color = TASK_BAR_COLORS.has(task.color) ? task.color : 'sage';
  const period = `${task.startDate} — ${task.endDate}`;
  const startInset = geometry.isClippedStart ? 0 : 4;
  const endInset = geometry.isClippedEnd ? 0 : 4;
  const barHeight = Math.max(8, Math.round(rowHeight * 0.64));

  return (
    <button
      aria-label={`Подробно: ${task.title}, ${period}`}
      className="gantt-task-bar absolute z-[2] flex cursor-pointer items-center overflow-hidden text-left font-semibold shadow-sm outline-none hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1"
      data-clipped-end={geometry.isClippedEnd || undefined}
      data-clipped-start={geometry.isClippedStart || undefined}
      data-color={color}
      onClick={() => onOpen(task)}
      style={{
        fontSize: rowHeight <= 13 ? 0 : rowHeight < GANTT_ROW_HEIGHT ? 9 : 11,
        height: barHeight,
        left: geometry.left + startInset,
        paddingInline: rowHeight <= 13 ? 2 : rowHeight < GANTT_ROW_HEIGHT ? 6 : 10,
        top: (rowHeight - barHeight) / 2,
        width: Math.max(geometry.width - startInset - endInset, 8),
      }}
      title={`${task.title}\n${period}`}
      type="button"
    >
      {rowHeight > 13 ? <span className="min-w-0 flex-1 truncate text-center">{task.title}</span> : null}
    </button>
  );
}
