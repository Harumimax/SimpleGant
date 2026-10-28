import type { Task } from '../tasks/tasks.api';
import { calculateTaskBarGeometry } from '../gantt/timeline';

const TASK_BAR_COLORS = new Set([
  'sage', 'blue', 'sky', 'lavender', 'plum',
  'rose', 'coral', 'sand', 'amber', 'teal',
]);

type Props = {
  task: Task;
  timelineStartDate: string;
  timelineEndDate: string;
  onOpen: (task: Task) => void;
};

export function ReadOnlyTaskBar({
  task,
  timelineStartDate,
  timelineEndDate,
  onOpen,
}: Props) {
  const geometry = calculateTaskBarGeometry(
    task.startDate,
    task.endDate,
    timelineStartDate,
    timelineEndDate,
  );
  if (!geometry || !task.startDate || !task.endDate) return null;
  const color = TASK_BAR_COLORS.has(task.color) ? task.color : 'sage';
  const period = `${task.startDate} — ${task.endDate}`;
  const startInset = geometry.isClippedStart ? 0 : 4;
  const endInset = geometry.isClippedEnd ? 0 : 4;

  return (
    <button
      aria-label={`Подробно: ${task.title}, ${period}`}
      className="gantt-task-bar absolute top-2 z-[2] flex h-7 cursor-pointer items-center overflow-hidden px-2.5 text-left text-[11px] font-semibold shadow-sm outline-none hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1"
      data-clipped-end={geometry.isClippedEnd || undefined}
      data-clipped-start={geometry.isClippedStart || undefined}
      data-color={color}
      onClick={() => onOpen(task)}
      style={{
        left: geometry.left + startInset,
        width: Math.max(geometry.width - startInset - endInset, 8),
      }}
      title={`${task.title}\n${period}`}
      type="button"
    >
      <span className="min-w-0 flex-1 truncate text-center">{task.title}</span>
    </button>
  );
}
