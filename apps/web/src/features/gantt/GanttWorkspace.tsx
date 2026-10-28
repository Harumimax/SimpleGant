import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
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
  Save,
} from 'lucide-react';
import { useRef, useState, type UIEvent } from 'react';

import type { ProjectDetail } from '../projects/projects.api';
import type { Milestone } from '../milestones/milestones.api';
import type { NonWorkingDay } from '../calendar/non-working-days.api';
import type { Task } from '../tasks/tasks.api';
import {
  flattenVisibleTasks,
  indentTask,
  moveTask,
  moveTaskByVisibleOffset,
  outdentTask,
  taskHasChildren,
} from './taskHierarchy';
import { TaskTableRow } from './TaskTableRow';
import {
  buildTimeline,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
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
  onSave?: () => void;
};

function columnTemplate(columnCount: number) {
  if (columnCount === 0) return '42px 96px';
  const extraColumns = Math.max(columnCount - 1, 0);
  return `42px minmax(190px, 2fr) repeat(${extraColumns}, minmax(104px, 1fr)) 96px`;
}

function taskTableMinWidth(columnCount: number) {
  if (columnCount === 0) return 138;
  return 42 + 190 + Math.max(columnCount - 1, 0) * 104 + 96;
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
  onSave,
}: GanttWorkspaceProps) {
  const taskPaneRef = useRef<HTMLElement>(null);
  const timelinePaneRef = useRef<HTMLDivElement>(null);
  const [areAdditionalColumnsHidden, setAreAdditionalColumnsHidden] = useState(false);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('days');
  const [dragPreviewTasks, setDragPreviewTasks] = useState<Task[] | null>(null);
  const [dragSource, setDragSource] = useState<'table' | 'timeline' | null>(null);
  const dragBaseTasksRef = useRef<Task[]>(tasks);
  const timeline = buildTimeline(
    project.startDate,
    project.endDate,
    timelineScale,
  );
  const nonWorkingDaysByDate = new Map(
    nonWorkingDays.map((day) => [day.date, day]),
  );
  const configuredColumns = [...project.columns]
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const columns = configuredColumns.filter((column) =>
    areAdditionalColumnsHidden ? column.key === 'title' : column.isVisible,
  );
  const taskGridTemplate = columnTemplate(columns.length);
  const taskTableWidth = taskTableMinWidth(columns.length);
  const tableTasks = dragSource === 'timeline' && dragPreviewTasks
    ? dragPreviewTasks
    : tasks;
  const timelineTasks = dragPreviewTasks ?? tasks;
  const visibleTasks = flattenVisibleTasks(tableTasks);
  const timelineVisibleTasks = flattenVisibleTasks(timelineTasks);
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
    setDragPreviewTasks(null);
    setDragSource(null);
    if (!over) return;
    const horizontalIntent: -1 | 0 | 1 =
      delta.x > 48 ? 1 : delta.x < -48 ? -1 : 0;
    saveStructure(
      moveTask(
        dragBaseTasksRef.current,
        String(active.id),
        String(over.id),
        horizontalIntent,
      ),
    );
  }

  function handleTableDragStart() {
    dragBaseTasksRef.current = tasks;
    setDragSource('table');
    setDragPreviewTasks(null);
  }

  function handleTableDragOver(event: DragOverEvent) {
    if (!event.over) return;
    const nextTasks = moveTask(
      dragBaseTasksRef.current,
      String(event.active.id),
      String(event.over.id),
      0,
    );
    setDragPreviewTasks(nextTasks);
  }

  function clearDragPreview() {
    setDragPreviewTasks(null);
    setDragSource(null);
  }

  function startTimelineTaskMove() {
    dragBaseTasksRef.current = tasks;
    setDragSource('timeline');
    setDragPreviewTasks(null);
  }

  function previewTimelineTaskMove(task: Task, rowDelta: number) {
    const baseTasks = dragBaseTasksRef.current;
    const nextTasks = moveTaskByVisibleOffset(baseTasks, task.id, rowDelta);
    setDragPreviewTasks(nextTasks);
    if (!nextTasks) return 0;

    const beforeIndex = flattenVisibleTasks(baseTasks)
      .findIndex(({ id }) => id === task.id);
    const afterIndex = flattenVisibleTasks(nextTasks)
      .findIndex(({ id }) => id === task.id);
    return beforeIndex < 0 || afterIndex < 0 ? 0 : afterIndex - beforeIndex;
  }

  async function moveTimelineTask(task: Task, rowDelta: number) {
    if (isSavingStructure) return;
    const nextTasks = dragPreviewTasks
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

  return (
    <>
      <section
        aria-label="Редактор диаграммы Ганта"
        className="relative hidden min-h-0 flex-1 flex-col lg:flex"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-5">
          <div
            aria-label="Масштаб временной шкалы"
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
                  <div aria-label="Действия" className="border-l border-[var(--color-border)]" />
                </div>
              </div>

              <div className="relative bg-white">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragCancel={clearDragPreview}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleTableDragOver}
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
                  {[
                    ...timelineVisibleTasks,
                    ...Array.from(
                      { length: Math.max(20 - timelineVisibleTasks.length, 0) },
                      () => null,
                    ),
                  ].map((task, rowIndex) => (
                    <div
                      aria-hidden={task ? undefined : true}
                      className="relative flex border-b border-[var(--color-border)]"
                      data-task-id={task?.id}
                      key={task?.id ?? `empty-${rowIndex}`}
                      style={{ height: GANTT_ROW_HEIGHT }}
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
                            className={`shrink-0 ${isGridBoundary ? 'border-r border-[var(--color-border)]' : ''} ${nonWorkingDay ? 'bg-[var(--color-non-working)]' : day.isWeekend ? 'bg-[var(--color-weekend)]' : 'bg-white'}`}
                            key={day.date}
                            style={{ width: timeline.dayWidth }}
                            title={nonWorkingDay?.label ? `${day.date} — ${nonWorkingDay.label}` : undefined}
                          />
                        );
                      })}
                      {task ? (
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
                          task={task}
                          timelineEndDate={project.endDate}
                          timelineStartDate={project.startDate}
                        />
                      ) : null}
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

        {onSave && isDirty ? (
          <div
            className="absolute bottom-5 right-5 z-40 flex items-center gap-3 rounded-xl border border-[var(--color-warning)] bg-white px-3 py-2.5 shadow-lg"
          >
            <div className="hidden text-right xl:block">
              <p className="text-xs font-semibold text-[var(--color-text)]">
                Есть несохранённые изменения
              </p>
              {saveError ? (
                <p className="mt-0.5 max-w-64 text-xs text-[var(--color-danger)]" role="alert">
                  {saveError}
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                  Изменения пока видны только вам
                </p>
              )}
            </div>
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isSaving}
              onClick={onSave}
              type="button"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden className="size-4" />
              )}
              {isSaving ? 'Сохраняем…' : 'Сохранить изменения'}
            </button>
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
