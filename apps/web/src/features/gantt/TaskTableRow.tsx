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
import type { Task, TaskColor } from '../tasks/tasks.api';
import { taskValue } from './taskValue';
import { GANTT_ROW_HEIGHT, type GanttRowDensity } from './timeline';

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
  rowDensity?: GanttRowDensity;
  rowHeight?: number;
  familyColor?: TaskColor;
  isGrouped?: boolean;
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
  rowDensity = 'normal',
  rowHeight = GANTT_ROW_HEIGHT,
  familyColor,
  isGrouped = false,
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
  const isCompact = rowDensity === 'compact';
  const isMaximum = rowDensity === 'maximum';
  const textSize = isMaximum ? 'text-[9px] leading-none' : isCompact ? 'text-[10px]' : 'text-xs';
  const cellPadding = isMaximum ? 'px-1' : isCompact ? 'px-2' : 'px-3';
  const dragWidth = isMaximum ? 'w-3' : isCompact ? 'w-5' : 'w-6';
  const controlSize = isMaximum ? 'size-3' : isCompact ? 'size-5' : 'size-6';
  const actionSize = isMaximum ? 'size-3' : isCompact ? 'size-5' : 'size-7';
  const iconSize = isMaximum ? 'size-2.5' : isCompact ? 'size-3' : 'size-3.5';
  const titleGap = isMaximum ? 'mr-0.5' : 'mr-1';
  const indentation = isMaximum ? 10 : isCompact ? 14 : 18;

  return (
    <div
      className={`grid overflow-hidden border-b border-[var(--color-border)] ${isGrouped ? 'task-family-row' : 'bg-white hover:bg-[var(--color-surface-hover)]'} ${isDragging ? 'relative z-30 opacity-55 shadow-lg' : ''}`}
      data-family-color={isGrouped ? familyColor : undefined}
      data-task-id={task.id}
      ref={setNodeRef}
      style={{
        gridTemplateColumns,
        height: rowHeight,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
          : previewRowOffset
            ? `translate3d(0, ${previewRowOffset * rowHeight}px, 0)`
            : undefined,
        transition: transition ?? (previewRowOffset ? 'transform 160ms ease' : undefined),
        zIndex: previewRowOffset ? 3 : undefined,
      }}
    >
      <div className={`flex items-center border-r border-[var(--color-border)] tabular-nums text-[var(--color-text-faint)] ${textSize}`}>
        <button
          aria-label={`Переместить задачу ${task.title}`}
          className={`grid h-full touch-none place-items-center text-[var(--color-text-faint)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--color-focus)] ${dragWidth}`}
          type="button"
          disabled={isDisabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className={iconSize} />
        </button>
        <span className="flex-1 pr-1 text-center">{rowNumber}</span>
      </div>

      {columns.map((column) => (
        <div
          className={`flex min-w-0 items-center border-r border-[var(--color-border)] text-[var(--color-text)] ${cellPadding} ${textSize}`}
          key={column.id}
          title={String(taskValue(task, column.key))}
        >
          {column.key === 'title' ? (
            <div
              className="flex min-w-0 items-center"
              style={{ paddingLeft: task.level * indentation }}
            >
              {hasChildren ? (
                <button
                  aria-label={task.isCollapsed ? `Раскрыть ${task.title}` : `Свернуть ${task.title}`}
                  className={`grid shrink-0 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${titleGap} ${controlSize}`}
                  disabled={isDisabled}
                  onClick={() => onToggleCollapsed(task)}
                  type="button"
                >
                  {task.isCollapsed ? <ChevronRight aria-hidden className={iconSize} /> : <ChevronDown aria-hidden className={iconSize} />}
                </button>
              ) : (
                <span className={`shrink-0 ${titleGap} ${controlSize}`} />
              )}
              <button
                className={`task-title-button min-w-0 truncate rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${(isCompact || isMaximum) ? 'task-title-button--dense' : ''}`}
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

      {showActions ? <div className={`flex items-center justify-center ${isMaximum ? 'gap-0' : 'gap-0.5'}`}>
        <button
          aria-label={`Уменьшить вложенность: ${task.title}`}
          className={`grid place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-25 ${actionSize}`}
          disabled={isDisabled || !canOutdent}
          onClick={() => onOutdent(task)}
          title="Уменьшить вложенность"
          type="button"
        >
          <IndentDecrease aria-hidden className={iconSize} />
        </button>
        <button
          aria-label={`Увеличить вложенность: ${task.title}`}
          className={`grid place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-25 ${actionSize}`}
          disabled={isDisabled || !canIndent}
          onClick={() => onIndent(task)}
          title="Увеличить вложенность"
          type="button"
        >
          <IndentIncrease aria-hidden className={iconSize} />
        </button>
        <button
          aria-label={`Подробно: ${task.title}`}
          className={`grid place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] ${actionSize}`}
          onClick={() => onDetails(task)}
          type="button"
        >
          <Ellipsis aria-hidden className={iconSize} />
        </button>
      </div> : null}
    </div>
  );
}
