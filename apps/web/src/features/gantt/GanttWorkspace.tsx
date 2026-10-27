import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CalendarDays,
  CircleAlert,
  Columns3,
  Flag,
  LoaderCircle,
  Monitor,
  Plus,
} from 'lucide-react';
import { useRef, type UIEvent } from 'react';

import type { ProjectDetail } from '../projects/projects.api';
import type { Milestone } from '../milestones/milestones.api';
import type { Task } from '../tasks/tasks.api';
import {
  flattenVisibleTasks,
  indentTask,
  moveTask,
  outdentTask,
  taskHasChildren,
} from './taskHierarchy';
import { TaskTableRow } from './TaskTableRow';
import {
  buildTimeline,
  GANTT_DAY_WIDTH,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
  type TaskDateRange,
} from './timeline';
import { TaskBar } from './TaskBar';
import { MilestoneLayer } from './MilestoneLayer';

type GanttWorkspaceProps = {
  project: ProjectDetail;
  tasks: Task[];
  milestones: Milestone[];
  onAddTask: () => void;
  onConfigureColumns: () => void;
  onConfigureMilestones: () => void;
  onTaskDetails: (task: Task) => void;
  onTaskDatesChange: (task: Task, dates: TaskDateRange) => Promise<void>;
  updatingTaskId?: string;
  dateChangeError?: string;
  onTaskOrderChange: (tasks: Task[]) => Promise<void>;
  onToggleTaskCollapsed: (task: Task) => Promise<void>;
  isSavingStructure?: boolean;
  structureChangeError?: string;
};

function columnTemplate(columnCount: number) {
  if (columnCount === 0) return '42px 96px';
  const extraColumns = Math.max(columnCount - 1, 0);
  return `42px minmax(190px, 2fr) repeat(${extraColumns}, minmax(104px, 1fr)) 96px`;
}

export function GanttWorkspace({
  project,
  tasks,
  milestones,
  onAddTask,
  onConfigureColumns,
  onConfigureMilestones,
  onTaskDetails,
  onTaskDatesChange,
  updatingTaskId,
  dateChangeError,
  onTaskOrderChange,
  onToggleTaskCollapsed,
  isSavingStructure = false,
  structureChangeError,
}: GanttWorkspaceProps) {
  const taskPaneRef = useRef<HTMLElement>(null);
  const timelinePaneRef = useRef<HTMLDivElement>(null);
  const timeline = buildTimeline(project.startDate, project.endDate);
  const columns = project.columns
    .filter(({ isVisible }) => isVisible)
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const taskGridTemplate = columnTemplate(columns.length);
  const visibleTasks = flattenVisibleTasks(tasks);
  const rows: Array<Task | null> = [
    ...visibleTasks,
    ...Array.from({ length: Math.max(20 - visibleTasks.length, 0) }, () => null),
  ];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function saveStructure(nextTasks: Task[] | null) {
    if (!nextTasks || isSavingStructure) return;
    void onTaskOrderChange(nextTasks).catch(() => undefined);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    if (!over) return;
    const horizontalIntent: -1 | 0 | 1 =
      delta.x > 28 ? 1 : delta.x < -28 ? -1 : 0;
    saveStructure(
      moveTask(tasks, String(active.id), String(over.id), horizontalIntent),
    );
  }

  function syncVerticalScroll(
    event: UIEvent<HTMLElement>,
    target: HTMLElement | null,
  ) {
    if (target && target.scrollTop !== event.currentTarget.scrollTop) {
      target.scrollTop = event.currentTarget.scrollTop;
    }
  }

  return (
    <>
      <section className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-5">
          <div className="flex items-center gap-2" aria-label="Масштаб временной шкалы">
            <span className="mr-1 text-sm text-[var(--color-text-muted)]">
              Масштаб
            </span>
            <button
              aria-pressed="true"
              className="h-8 rounded-md bg-[var(--color-accent-soft)] px-3 text-xs font-semibold text-[var(--color-accent)]"
              type="button"
            >
              Дни
            </button>
            <button
              className="h-8 rounded-md px-3 text-xs font-medium text-[var(--color-text-muted)] opacity-50"
              disabled
              title="Появится в следующих шагах"
              type="button"
            >
              Недели
            </button>
            <button
              className="h-8 rounded-md px-3 text-xs font-medium text-[var(--color-text-muted)] opacity-50"
              disabled
              title="Появится в следующих шагах"
              type="button"
            >
              Месяцы
            </button>
          </div>

          <div className="flex items-center gap-3">
            {dateChangeError || structureChangeError ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-danger)]" role="alert">
                <CircleAlert aria-hidden className="size-4" />
                Не удалось сохранить изменения
              </span>
            ) : updatingTaskId || isSavingStructure ? (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]" role="status">
                <LoaderCircle aria-hidden className="size-4 animate-spin" />
                Сохраняем изменения…
              </span>
            ) : null}
            <button
              className="flex h-9 items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onClick={onConfigureMilestones}
              type="button"
            >
              <Flag aria-hidden className="size-4" />
              Вехи
            </button>
            <button
              className="flex h-9 items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onClick={onConfigureColumns}
              type="button"
            >
              <Columns3 aria-hidden className="size-4" />
              Колонки
            </button>
            <button
              className="flex h-9 items-center gap-2 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onClick={onAddTask}
              type="button"
            >
              <Plus aria-hidden className="size-4" />
              Добавить задачу
            </button>
          </div>
        </div>

        <div className="gantt-shell min-h-0 flex-1">
          <section
            className="gantt-task-pane"
            aria-label="Таблица задач"
            onScroll={(event) => syncVerticalScroll(event, timelinePaneRef.current)}
            ref={taskPaneRef}
          >
            <div
              className="sticky top-0 z-20 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]"
              style={{ height: GANTT_HEADER_HEIGHT }}
            >
              <div className="flex h-8 items-center border-b border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-muted)]">
                Структура проекта
              </div>
              <div
                className="grid h-[58px] items-stretch"
                style={{ gridTemplateColumns: taskGridTemplate }}
              >
                <div className="grid place-items-center border-r border-[var(--color-border)] text-xs text-[var(--color-text-faint)]">
                  №
                </div>
                {columns.map((column) => (
                  <div
                    className="flex min-w-0 items-center border-r border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text)] last:border-r-0"
                    key={column.id}
                    title={column.name}
                  >
                    <span className="truncate">{column.name}</span>
                  </div>
                ))}
                <div aria-label="Действия" className="border-l border-[var(--color-border)]" />
              </div>
            </div>

            <div className="relative bg-white">
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                <SortableContext
                  items={visibleTasks.map(({ id }) => id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleTasks.map((task, index) => (
                    <TaskTableRow
                      canIndent={Boolean(indentTask(tasks, task.id))}
                      canOutdent={Boolean(task.parentId)}
                      columns={columns}
                      gridTemplateColumns={taskGridTemplate}
                      hasChildren={taskHasChildren(tasks, task.id)}
                      isDisabled={isSavingStructure}
                      key={task.id}
                      onDetails={onTaskDetails}
                      onIndent={(selectedTask) =>
                        saveStructure(indentTask(tasks, selectedTask.id))
                      }
                      onOutdent={(selectedTask) =>
                        saveStructure(outdentTask(tasks, selectedTask.id))
                      }
                      onToggleCollapsed={(selectedTask) => {
                        if (!isSavingStructure) {
                          void onToggleTaskCollapsed(selectedTask).catch(
                            () => undefined,
                          );
                        }
                      }}
                      rowNumber={index + 1}
                      task={task}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {rows.slice(visibleTasks.length).map((_, index) => (
                <div
                  aria-hidden="true"
                  className="grid border-b border-[var(--color-border)]"
                  key={`empty-${index}`}
                  style={{
                    gridTemplateColumns: taskGridTemplate,
                    height: GANTT_ROW_HEIGHT,
                  }}
                >
                  <div className="border-r border-[var(--color-border)]" />
                  {columns.map((column) => (
                    <div
                      className="border-r border-[var(--color-border)]"
                      key={column.id}
                    />
                  ))}
                  <div />
                </div>
              ))}

              {tasks.length === 0 ? <div className="pointer-events-none absolute inset-x-8 top-20 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-white/95 px-5 py-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  В проекте пока нет задач
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                  Здесь появятся строки задач и их поля.
                </p>
              </div> : null}
            </div>
          </section>

          <section className="gantt-timeline-pane" aria-label="Временная сетка">
            <div
              aria-label="Горизонтальная прокрутка временной шкалы"
              className="gantt-timeline-scroll focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
              onScroll={(event) => syncVerticalScroll(event, taskPaneRef.current)}
              ref={timelinePaneRef}
              role="region"
              tabIndex={0}
            >
              <div className="relative" style={{ minWidth: timeline.width, width: timeline.width }}>
                <div
                  className="sticky top-0 z-10 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]"
                  style={{ height: GANTT_HEADER_HEIGHT }}
                >
                  <div className="flex h-[30px] border-b border-[var(--color-border)]">
                    {timeline.months.map((month) => (
                      <div
                        className="flex items-center justify-center border-r border-[var(--color-border-strong)] px-2 text-xs font-semibold text-[var(--color-text)]"
                        key={month.key}
                        style={{ width: month.dayCount * GANTT_DAY_WIDTH }}
                      >
                        <span className="truncate">{month.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex h-[26px] border-b border-[var(--color-border)]">
                    {timeline.weeks.map((week) => (
                      <div
                        className="flex items-center justify-center border-r border-[var(--color-border)] text-[10px] font-medium text-[var(--color-text-muted)]"
                        key={week.key}
                        style={{ width: week.dayCount * GANTT_DAY_WIDTH }}
                      >
                        {week.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-[34px]">
                    {timeline.days.map((day) => (
                      <div
                        className={`flex shrink-0 flex-col items-center justify-center border-r border-[var(--color-border)] text-[10px] ${day.isWeekend ? 'bg-[var(--color-weekend)] text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}
                        key={day.date}
                        style={{ width: GANTT_DAY_WIDTH }}
                        title={day.date}
                      >
                        <span className="font-semibold leading-none">
                          {day.dayNumber}
                        </span>
                        <span className="mt-0.5 text-[9px] leading-none">
                          {day.weekday}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {rows.map((task, rowIndex) => (
                    <div
                      aria-hidden={task ? undefined : true}
                      className="relative flex border-b border-[var(--color-border)]"
                      key={task?.id ?? `empty-${rowIndex}`}
                      style={{ height: GANTT_ROW_HEIGHT }}
                    >
                      {timeline.days.map((day) => (
                        <div
                          className={`shrink-0 border-r border-[var(--color-border)] ${day.isWeekend ? 'bg-[var(--color-weekend)]' : 'bg-white'}`}
                          key={day.date}
                          style={{ width: GANTT_DAY_WIDTH }}
                        />
                      ))}
                      {task ? (
                        <TaskBar
                          isDateLocked={taskHasChildren(tasks, task.id)}
                          isSaving={updatingTaskId === task.id}
                          onDateChange={onTaskDatesChange}
                          onOpen={onTaskDetails}
                          task={task}
                          timelineEndDate={project.endDate}
                          timelineStartDate={project.startDate}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                <MilestoneLayer
                  milestones={milestones}
                  timelineEndDate={project.endDate}
                  timelineStartDate={project.startDate}
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid flex-1 place-items-center px-5 py-12 md:hidden">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-accent)]">
            <Monitor aria-hidden className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Откройте редактор на компьютере</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Рабочая таблица и временная шкала требуют больше места. Мобильный просмотр появится в отдельном режиме.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
            <CalendarDays aria-hidden className="size-4" />
            {project.startDate} — {project.endDate}
          </div>
        </div>
      </section>
    </>
  );
}
