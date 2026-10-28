import { useSortable } from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  Ellipsis,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
} from 'lucide-react';

import type { ProjectColumn } from '../projects/projects.api';
import type { Task } from '../tasks/tasks.api';
import { taskValue } from './taskValue';
import { GANTT_ROW_HEIGHT } from './timeline';

type Props = {
  task: Task;
  rowNumber: number;
  columns: ProjectColumn[];
  gridTemplateColumns: string;
  hasChildren: boolean;
  canIndent: boolean;
  canOutdent: boolean;
  isDisabled?: boolean;
  previewRowOffset?: number;
  showActions?: boolean;
  onDetails: (task: Task) => void;
  onIndent: (task: Task) => void;
  onOutdent: (task: Task) => void;
  onToggleCollapsed: (task: Task) => void;
};

export function TaskTableRow({
  task,
  rowNumber,
  columns,
  gridTemplateColumns,
  hasChildren,
  canIndent,
  canOutdent,
  isDisabled = false,
  previewRowOffset = 0,
  showActions = true,
  onDetails,
  onIndent,
  onOutdent,
  onToggleCollapsed,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDisabled });

  return (
    <div
      className={`grid border-b border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-hover)] ${isDragging ? 'relative z-30 opacity-55 shadow-lg' : ''}`}
      data-task-id={task.id}
      ref={setNodeRef}
      style={{
        gridTemplateColumns,
        height: GANTT_ROW_HEIGHT,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
          : previewRowOffset
            ? `translate3d(0, ${previewRowOffset * GANTT_ROW_HEIGHT}px, 0)`
            : undefined,
        transition: transition ?? (previewRowOffset ? 'transform 160ms ease' : undefined),
        zIndex: previewRowOffset ? 3 : undefined,
      }}
    >
      <div className="flex items-center border-r border-[var(--color-border)] text-xs tabular-nums text-[var(--color-text-faint)]">
        <button
          aria-label={`Переместить задачу ${task.title}`}
          className="grid h-full w-6 touch-none place-items-center text-[var(--color-text-faint)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--color-focus)]"
          type="button"
          disabled={isDisabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className="size-3.5" />
        </button>
        <span className="flex-1 pr-1 text-center">{rowNumber}</span>
      </div>

      {columns.map((column) => (
        <div
          className="flex min-w-0 items-center border-r border-[var(--color-border)] px-3 text-xs text-[var(--color-text)]"
          key={column.id}
          title={String(taskValue(task, column.key))}
        >
          {column.key === 'title' ? (
            <div
              className="flex min-w-0 items-center"
              style={{ paddingLeft: task.level * 18 }}
            >
              {hasChildren ? (
                <button
                  aria-label={task.isCollapsed ? `Раскрыть ${task.title}` : `Свернуть ${task.title}`}
                  className="mr-1 grid size-6 shrink-0 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  disabled={isDisabled}
                  onClick={() => onToggleCollapsed(task)}
                  type="button"
                >
                  {task.isCollapsed ? <ChevronRight aria-hidden className="size-3.5" /> : <ChevronDown aria-hidden className="size-3.5" />}
                </button>
              ) : (
                <span className="mr-1 size-6 shrink-0" />
              )}
              <button
                className="task-title-button min-w-0 truncate rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                onClick={() => onDetails(task)}
                type="button"
              >
                {task.title}
              </button>
            </div>
          ) : (
            <span className="truncate">{taskValue(task, column.key)}</span>
          )}
        </div>
      ))}

      {showActions ? <div className="flex items-center justify-center gap-0.5">
        <button
          aria-label={`Уменьшить вложенность: ${task.title}`}
          className="grid size-7 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-25"
          disabled={isDisabled || !canOutdent}
          onClick={() => onOutdent(task)}
          title="Уменьшить вложенность"
          type="button"
        >
          <IndentDecrease aria-hidden className="size-3.5" />
        </button>
        <button
          aria-label={`Увеличить вложенность: ${task.title}`}
          className="grid size-7 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-25"
          disabled={isDisabled || !canIndent}
          onClick={() => onIndent(task)}
          title="Увеличить вложенность"
          type="button"
        >
          <IndentIncrease aria-hidden className="size-3.5" />
        </button>
        <button
          aria-label={`Подробно: ${task.title}`}
          className="grid size-7 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]"
          onClick={() => onDetails(task)}
          type="button"
        >
          <Ellipsis aria-hidden className="size-3.5" />
        </button>
      </div> : null}
    </div>
  );
}
