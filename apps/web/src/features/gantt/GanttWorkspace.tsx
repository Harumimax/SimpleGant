import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragMoveEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CalendarDays,
  CalendarOff,
  CircleAlert,
  Columns3,
  Eye,
  EyeOff,
  Flag,
  LoaderCircle,
  Monitor,
  Plus,
} from 'lucide-react';
import { useRef, useState, type UIEvent } from 'react';

import type { ProjectDetail } from '../projects/projects.api';
import type { Milestone } from '../milestones/milestones.api';
import type { NonWorkingDay } from '../calendar/non-working-days.api';
import type { Task } from '../tasks/tasks.api';
import {
  buildTaskFamilyVisuals,
  flattenVisibleTasks,
  indentTask,
  moveTaskByVisibleOffset,
  outdentTask,
  taskHasChildren,
} from './taskHierarchy';
import { TaskTableRow } from './TaskTableRow';
import {
  buildTimeline,
  calculateGanttRowDelta,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHTS,
  type GanttRowDensity,
  type TaskDateRange,
  type TimelineScale,
} from './timeline';
import { TaskBar } from './TaskBar';
import { MilestoneLayer } from './MilestoneLayer';

type GanttWorkspaceProps = {
  project: ProjectDetail;
  tasks: Task[];
  milestones: Milestone[];
  nonWorkingDays: NonWorkingDay[];
  onAddTask: () => void;
  onConfigureColumns: () => void;
  onConfigureMilestones: () => void;
  onConfigureNonWorkingDays: () => void;
  onTaskDetails: (task: Task) => void;
  onTaskDatesChange: (task: Task, dates: TaskDateRange) => Promise<void>;
  updatingTaskId?: string;
  dateChangeError?: string;
  onTaskOrderChange: (tasks: Task[]) => Promise<void>;
  onToggleTaskCollapsed: (task: Task) => Promise<void>;
  isSavingStructure?: boolean;
  structureChangeError?: string;
  isDirty?: boolean;
  isSaving?: boolean;
  saveError?: string;
  onRetrySave?: () => void;
};

function columnTemplate(columnCount: number, showActions: boolean) {
  if (columnCount === 0) return showActions ? '42px 96px' : '42px';
  const extraColumns = Math.max(columnCount - 1, 0);
  const actionsColumn = showActions ? ' 96px' : '';
  return `42px minmax(190px, 2fr) repeat(${extraColumns}, minmax(104px, 1fr))${actionsColumn}`;
}

function taskTableMinWidth(columnCount: number, showActions: boolean) {
  const actionsWidth = showActions ? 96 : 0;
  if (columnCount === 0) return 42 + actionsWidth;
  return 42 + 190 + Math.max(columnCount - 1, 0) * 104 + actionsWidth;
}

export function GanttWorkspace({
  project,
  tasks,
  milestones,
  nonWorkingDays,
  onAddTask,
  onConfigureColumns,
  onConfigureMilestones,
  onConfigureNonWorkingDays,
  onTaskDetails,
  onTaskDatesChange,
  updatingTaskId,
  dateChangeError,
  onTaskOrderChange,
  onToggleTaskCollapsed,
  isSavingStructure = false,
  structureChangeError,
  isDirty = false,
  isSaving = false,
  saveError,
  onRetrySave,
}: GanttWorkspaceProps) {
  const taskPaneRef = useRef<HTMLElement>(null);
  const timelinePaneRef = useRef<HTMLDivElement>(null);
  const [areAdditionalColumnsHidden, setAreAdditionalColumnsHidden] = useState(false);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('days');
  const [rowDensity, setRowDensity] = useState<GanttRowDensity>('normal');
  const [dragPreviewTasks, setDragPreviewTasks] = useState<Task[] | null>(null);
  const [dragSource, setDragSource] = useState<'table' | 'timeline' | null>(null);
  const dragBaseTasksRef = useRef<Task[]>(tasks);
  const dragPreviewTasksRef = useRef<Task[] | null>(null);
  const dragRowDeltaRef = useRef(0);
  const timeline = buildTimeline(
    project.startDate,
    project.endDate,
    timelineScale,
  );
  const rowHeight = GANTT_ROW_HEIGHTS[rowDensity];
  const nonWorkingDaysByDate = new Map(
    nonWorkingDays.map((day) => [day.date, day]),
  );
  const configuredColumns = [...project.columns]
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const columns = configuredColumns.filter((column) =>
    areAdditionalColumnsHidden ? column.key === 'title' : column.isVisible,
  );
  const showTaskActions = !areAdditionalColumnsHidden;
  const taskGridTemplate = columnTemplate(columns.length, showTaskActions);
  const taskTableWidth = taskTableMinWidth(columns.length, showTaskActions);
  const visibleTasks = flattenVisibleTasks(tasks);
  const previewVisibleTasks = dragPreviewTasks
    ? flattenVisibleTasks(dragPreviewTasks)
    : visibleTasks;
  const taskFamilyVisuals = buildTaskFamilyVisuals(dragPreviewTasks ?? tasks);
  const previewIndexes = new Map(
    previewVisibleTasks.map((task, index) => [task.id, index]),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function saveStructure(nextTasks: Task[] | null) {
    if (!nextTasks || isSavingStructure) return;
    void onTaskOrderChange(nextTasks).catch(() => undefined);
  }

  function handleDragEnd() {
    const nextTasks = dragRowDeltaRef.current === 0
      ? null
      : dragPreviewTasksRef.current;
    clearDragPreview();
    saveStructure(nextTasks);
  }

  function handleTableDragStart() {
    dragBaseTasksRef.current = tasks;
    setDragSource('table');
    dragRowDeltaRef.current = 0;
    dragPreviewTasksRef.current = null;
    setDragPreviewTasks(null);
  }

  function handleTableDragMove(event: DragMoveEvent) {
    const rowDelta = calculateGanttRowDelta(event.delta.y, rowHeight);
    dragRowDeltaRef.current = rowDelta;
    if (rowDelta === 0) {
      dragPreviewTasksRef.current = null;
      setDragPreviewTasks(null);
      return;
    }

    const nextTasks = moveTaskByVisibleOffset(
      dragBaseTasksRef.current,
      String(event.active.id),
      rowDelta,
    );
    if (!nextTasks) return;

    dragPreviewTasksRef.current = nextTasks;
    setDragPreviewTasks(nextTasks);
  }

  function clearDragPreview() {
    dragRowDeltaRef.current = 0;
    dragPreviewTasksRef.current = null;
    setDragPreviewTasks(null);
    setDragSource(null);
  }

  function startTimelineTaskMove() {
    dragBaseTasksRef.current = tasks;
    setDragSource('timeline');
    dragRowDeltaRef.current = 0;
    dragPreviewTasksRef.current = null;
    setDragPreviewTasks(null);
  }

  function previewTimelineTaskMove(task: Task, rowDelta: number) {
    dragRowDeltaRef.current = rowDelta;
    if (rowDelta === 0) {
      dragPreviewTasksRef.current = null;
      setDragPreviewTasks(null);
      return 0;
    }

    const baseTasks = dragBaseTasksRef.current;
    const nextTasks = moveTaskByVisibleOffset(baseTasks, task.id, rowDelta);
    if (!nextTasks) return 0;

    dragPreviewTasksRef.current = nextTasks;
    setDragPreviewTasks(nextTasks);

    const beforeIndex = flattenVisibleTasks(baseTasks)
      .findIndex(({ id }) => id === task.id);
    const afterIndex = flattenVisibleTasks(nextTasks)
      .findIndex(({ id }) => id === task.id);
    return beforeIndex < 0 || afterIndex < 0 ? 0 : afterIndex - beforeIndex;
  }

  async function moveTimelineTask(task: Task, rowDelta: number) {
    if (isSavingStructure) return;
    const nextTasks = dragPreviewTasksRef.current
      ?? moveTaskByVisibleOffset(dragBaseTasksRef.current, task.id, rowDelta);
    clearDragPreview();
    if (nextTasks) await onTaskOrderChange(nextTasks);
  }

  function syncVerticalScroll(
    event: UIEvent<HTMLElement>,
    target: HTMLElement | null,
  ) {
    if (target && target.scrollTop !== event.currentTarget.scrollTop) {
      target.scrollTop = event.currentTarget.scrollTop;
    }
  }

  function changeTimelineScale(nextScale: TimelineScale) {
    if (nextScale === timelineScale) return;
    const scrollElement = timelinePaneRef.current;
    const visibleDayOffset = scrollElement
      ? scrollElement.scrollLeft / timeline.dayWidth
      : 0;

    setTimelineScale(nextScale);
    requestAnimationFrame(() => {
      if (scrollElement) {
        scrollElement.scrollLeft = visibleDayOffset * buildTimeline(
          project.startDate,
          project.endDate,
          nextScale,
        ).dayWidth;
      }
    });
  }

  function changeRowDensity(nextDensity: GanttRowDensity) {
    if (nextDensity === rowDensity) return;
    const visibleRowOffset = (taskPaneRef.current?.scrollTop ?? 0) / rowHeight;
    const nextRowHeight = GANTT_ROW_HEIGHTS[nextDensity];

    setRowDensity(nextDensity);
    requestAnimationFrame(() => {
      const nextScrollTop = visibleRowOffset * nextRowHeight;
      if (taskPaneRef.current) taskPaneRef.current.scrollTop = nextScrollTop;
      if (timelinePaneRef.current) timelinePaneRef.current.scrollTop = nextScrollTop;
    });
  }

  return (
    <>
      <section
        aria-label="Редактор диаграммы Ганта"
        className="relative hidden min-h-0 flex-1 flex-col lg:flex"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-5">
          <div
            aria-label="Масштаб диаграммы"
            className="flex items-center gap-2"
            role="group"
          >
            <span className="mr-1 text-sm text-[var(--color-text-muted)]">
              Масштаб
            </span>
            <button
              aria-pressed={timelineScale === 'days'}
              className={`h-8 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${timelineScale === 'days' ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]' : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]'}`}
              onClick={() => changeTimelineScale('days')}
              type="button"
            >
              Дни
            </button>
            <button
              aria-pressed={timelineScale === 'weeks'}
              className={`h-8 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${timelineScale === 'weeks' ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]' : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]'}`}
              onClick={() => changeTimelineScale('weeks')}
              type="button"
            >
              Недели
            </button>
            <button
              aria-pressed={timelineScale === 'months'}
              className={`h-8 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${timelineScale === 'months' ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]' : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]'}`}
              onClick={() => changeTimelineScale('months')}
              type="button"
            >
              Месяцы
            </button>
            <span className="ml-2 border-l border-[var(--color-border)] pl-3 text-sm text-[var(--color-text-muted)]">
              Строки
            </span>
            {([
              ['normal', 'Обычно'],
              ['compact', 'Компактно'],
              ['maximum', 'Максимум'],
            ] as const).map(([density, label]) => (
              <button
                aria-pressed={rowDensity === density}
                className={`h-8 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${rowDensity === density ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]' : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]'}`}
                key={density}
                onClick={() => changeRowDensity(density)}
                title={density === 'normal' ? 'Обычная высота строк' : density === 'compact' ? 'Строки ниже на 40%' : 'Строки ниже на 70%'}
                type="button"
              >
                {label}
              </button>
            ))}
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
              onClick={onConfigureNonWorkingDays}
              title="Нерабочие дни"
              type="button"
            >
              <CalendarOff aria-hidden className="size-4" />
              Календарь
            </button>
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

        <div
          className="gantt-shell min-h-0 flex-1"
          data-columns-collapsed={areAdditionalColumnsHidden}
        >
          <section
            className="gantt-task-pane"
            aria-label="Таблица задач"
            onScroll={(event) => syncVerticalScroll(event, timelinePaneRef.current)}
            ref={taskPaneRef}
            tabIndex={0}
          >
            <div className="gantt-task-table" style={{ minWidth: taskTableWidth }}>
              <div
                className="sticky top-0 z-20 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]"
                style={{ height: GANTT_HEADER_HEIGHT }}
              >
                <div className="flex h-8 items-center border-b border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-muted)]">
                  <span>Структура проекта</span>
                  <button
                    aria-label={areAdditionalColumnsHidden ? 'Показать дополнительные колонки' : 'Скрыть дополнительные колонки'}
                    aria-pressed={areAdditionalColumnsHidden}
                    className="sticky right-2 ml-auto flex h-7 items-center gap-1.5 rounded-md bg-[var(--color-surface-subtle)] px-2 text-[11px] font-semibold text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
                    onClick={() => setAreAdditionalColumnsHidden((current) => !current)}
                    title={areAdditionalColumnsHidden ? 'Показать дополнительные колонки' : 'Скрыть дополнительные колонки'}
                    type="button"
                  >
                    {areAdditionalColumnsHidden ? <Eye aria-hidden className="size-3.5" /> : <EyeOff aria-hidden className="size-3.5" />}
                    {areAdditionalColumnsHidden ? 'Показать' : 'Скрыть'}
                  </button>
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
                  {showTaskActions ? (
                    <div aria-label="Действия" className="border-l border-[var(--color-border)]" />
                  ) : null}
                </div>
              </div>

              <div className="relative bg-white">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragCancel={clearDragPreview}
                  onDragEnd={handleDragEnd}
                  onDragMove={handleTableDragMove}
                  onDragStart={handleTableDragStart}
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
                        familyColor={taskFamilyVisuals.get(task.id)?.color}
                        isGrouped={taskFamilyVisuals.get(task.id)?.isGrouped}
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
                        rowDensity={rowDensity}
                        rowHeight={rowHeight}
                        showActions={showTaskActions}
                        previewRowOffset={dragSource === 'timeline'
                          ? (previewIndexes.get(task.id) ?? index) - index
                          : 0}
                        task={task}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {tasks.length === 0 ? <div className="pointer-events-none absolute inset-x-8 top-20 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-white/95 px-5 py-6 text-center shadow-sm">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    В проекте пока нет задач
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                    Здесь появятся строки задач и их поля.
                  </p>
                </div> : null}
              </div>
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
              <div
                className="relative"
                data-timeline-scale={timelineScale}
                style={{ minWidth: timeline.width, width: timeline.width }}
              >
                <div
                  className="sticky top-0 z-10 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]"
                  style={{ height: GANTT_HEADER_HEIGHT }}
                >
                  {timelineScale === 'months' ? (
                    <>
                      <div className="flex h-[34px] border-b border-[var(--color-border)]">
                        {timeline.years.map((year) => (
                          <div
                            className="flex shrink-0 items-center border-r border-[var(--color-border-strong)] px-2 text-xs font-semibold text-[var(--color-text)]"
                            key={year.key}
                            style={{ width: year.dayCount * timeline.dayWidth }}
                          >
                            <span className="sticky left-2">{year.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex h-[56px]">
                        {timeline.months.map((month) => (
                          <div
                            className="flex shrink-0 items-center justify-center border-r border-[var(--color-border-strong)] px-2 text-[11px] font-medium text-[var(--color-text-muted)]"
                            key={month.key}
                            style={{ width: month.dayCount * timeline.dayWidth }}
                            title={month.label}
                          >
                            <span className="truncate">{month.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`flex border-b border-[var(--color-border)] ${timelineScale === 'days' ? 'h-[30px]' : 'h-10'}`}>
                        {timeline.months.map((month) => (
                          <div
                            className="flex shrink-0 items-center justify-center border-r border-[var(--color-border-strong)] px-2 text-xs font-semibold text-[var(--color-text)]"
                            key={month.key}
                            style={{ width: month.dayCount * timeline.dayWidth }}
                            title={month.label}
                          >
                            <span className="truncate">{month.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`flex ${timelineScale === 'days' ? 'h-[26px] border-b border-[var(--color-border)]' : 'h-[50px]'}`}>
                        {timeline.weeks.map((week) => (
                          <div
                            className="flex shrink-0 items-center justify-center border-r border-[var(--color-border)] px-1 text-[10px] font-medium text-[var(--color-text-muted)]"
                            key={week.key}
                            style={{ width: week.dayCount * timeline.dayWidth }}
                          >
                            <span className="truncate">{week.label}</span>
                          </div>
                        ))}
                      </div>
                      {timelineScale === 'days' ? (
                        <div className="flex h-[34px]">
                          {timeline.days.map((day) => {
                            const nonWorkingDay = nonWorkingDaysByDate.get(day.date);
                            return (
                              <div
                                className={`flex shrink-0 flex-col items-center justify-center border-r border-[var(--color-border)] text-[10px] ${nonWorkingDay ? 'bg-[var(--color-non-working)] text-[var(--color-warning)]' : day.isWeekend ? 'bg-[var(--color-weekend)] text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}
                                key={day.date}
                                style={{ width: timeline.dayWidth }}
                                title={nonWorkingDay?.label ? `${day.date} — ${nonWorkingDay.label}` : day.date}
                              >
                                <span className="font-semibold leading-none">{day.dayNumber}</span>
                                <span className="mt-0.5 text-[9px] leading-none">{day.weekday}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="relative">
                  {visibleTasks.map((task, rowIndex) => (
                    <div
                      className={`relative flex border-b border-[var(--color-border)] ${taskFamilyVisuals.get(task.id)?.isGrouped ? 'gantt-family-row' : ''}`}
                      data-family-color={taskFamilyVisuals.get(task.id)?.isGrouped ? taskFamilyVisuals.get(task.id)?.color : undefined}
                      data-task-id={task.id}
                      key={task.id}
                      style={{
                        height: rowHeight,
                        transform: task && dragPreviewTasks
                          ? `translateY(${((previewIndexes.get(task.id) ?? rowIndex) - rowIndex) * rowHeight}px)`
                          : undefined,
                        transition: dragPreviewTasks ? 'transform 160ms ease' : undefined,
                        zIndex: task && dragPreviewTasks && (previewIndexes.get(task.id) ?? rowIndex) !== rowIndex
                          ? 3
                          : undefined,
                      }}
                    >
                      {timeline.days.map((day, dayIndex) => {
                        const nonWorkingDay = nonWorkingDaysByDate.get(day.date);
                        const nextDay = timeline.days[dayIndex + 1];
                        const isGridBoundary = timelineScale === 'days'
                          || (timelineScale === 'weeks'
                            ? day.weekKey !== nextDay?.weekKey
                            : day.monthKey !== nextDay?.monthKey);
                        return (
                          <div
                            className={`shrink-0 ${taskFamilyVisuals.get(task.id)?.isGrouped ? 'gantt-family-cell' : ''} ${isGridBoundary ? 'border-r border-[var(--color-border)]' : ''} ${nonWorkingDay ? 'is-non-working bg-[var(--color-non-working)]' : day.isWeekend ? 'is-weekend bg-[var(--color-weekend)]' : 'bg-white'}`}
                            key={day.date}
                            style={{ width: timeline.dayWidth }}
                            title={nonWorkingDay?.label ? `${day.date} — ${nonWorkingDay.label}` : undefined}
                          />
                        );
                      })}
                      <TaskBar
                        dayWidth={timeline.dayWidth}
                        isDateLocked={taskHasChildren(tasks, task.id)}
                        isSaving={updatingTaskId === task.id}
                        onDateChange={onTaskDatesChange}
                        onOpen={onTaskDetails}
                        onVerticalMoveCancel={clearDragPreview}
                        onVerticalMove={moveTimelineTask}
                        onVerticalMovePreview={previewTimelineTaskMove}
                        onVerticalMoveStart={startTimelineTaskMove}
                        rowHeight={rowHeight}
                        task={task}
                        timelineEndDate={project.endDate}
                        timelineStartDate={project.startDate}
                      />
                    </div>
                  ))}
                </div>
                <MilestoneLayer
                  dayWidth={timeline.dayWidth}
                  milestones={milestones}
                  timelineEndDate={project.endDate}
                  timelineStartDate={project.startDate}
                />
              </div>
            </div>
          </section>
        </div>

        {isDirty ? (
          <div
            className={`absolute bottom-5 right-5 z-40 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-lg ${saveError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border-strong)]'}`}
            role={saveError ? 'alert' : 'status'}
          >
            {saveError ? (
              <CircleAlert aria-hidden className="size-4 shrink-0 text-[var(--color-danger)]" />
            ) : (
              <LoaderCircle aria-hidden className={`size-4 shrink-0 text-[var(--color-accent)] ${isSaving ? 'animate-spin' : ''}`} />
            )}
            <p className={`max-w-72 text-xs ${saveError ? 'text-[var(--color-danger)]' : 'font-medium text-[var(--color-text-muted)]'}`}>
              {saveError ?? 'Сохраняем изменения…'}
            </p>
            {saveError && onRetrySave ? (
              <button
                className="ml-1 h-7 rounded-md px-2 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                onClick={onRetrySave}
                type="button"
              >
                Повторить
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid flex-1 place-items-center px-5 py-12 lg:hidden">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-accent)]">
            <Monitor aria-hidden className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Увеличьте ширину окна</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Для работы с таблицей и временной шкалой требуется окно шириной не менее 1024 пикселей.
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
