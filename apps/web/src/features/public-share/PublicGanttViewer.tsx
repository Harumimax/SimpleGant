import { CalendarDays, Eye, EyeOff, Monitor } from 'lucide-react';
import { useRef, useState, type UIEvent } from 'react';

import type { GanttAggregate } from '../gantt/gantt.api';
import { MilestoneLayer } from '../gantt/MilestoneLayer';
import { flattenVisibleTasks } from '../gantt/taskHierarchy';
import { taskValue } from '../gantt/taskValue';
import {
  buildTimeline,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
  type TimelineScale,
} from '../gantt/timeline';
import type { Task } from '../tasks/tasks.api';
import { ReadOnlyTaskBar } from './ReadOnlyTaskBar';

type Props = GanttAggregate & {
  onTaskDetails: (task: Task) => void;
};

function columnTemplate(columnCount: number, compact: boolean) {
  if (columnCount === 0) return '42px';
  if (compact) return '42px minmax(190px, 1fr)';
  return `42px minmax(210px, 2fr) repeat(${Math.max(columnCount - 1, 0)}, minmax(110px, 1fr))`;
}

function taskTableMinWidth(columnCount: number, compact: boolean) {
  if (columnCount === 0) return 42;
  if (compact) return 232;
  return 42 + 210 + Math.max(columnCount - 1, 0) * 110;
}

export function PublicGanttViewer({
  project,
  tasks,
  milestones,
  nonWorkingDays,
  onTaskDetails,
}: Props) {
  const taskPaneRef = useRef<HTMLElement>(null);
  const timelinePaneRef = useRef<HTMLDivElement>(null);
  const [areAdditionalColumnsHidden, setAreAdditionalColumnsHidden] = useState(false);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('days');
  const columns = [...project.columns]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .filter((column) => areAdditionalColumnsHidden
      ? column.key === 'title'
      : column.isVisible);
  const timeline = buildTimeline(project.startDate, project.endDate, timelineScale);
  const visibleTasks = flattenVisibleTasks(tasks);
  const rows: Array<Task | null> = [...visibleTasks];
  const nonWorkingDaysByDate = new Map(
    nonWorkingDays.map((day) => [day.date, day]),
  );
  const gridTemplate = columnTemplate(columns.length, areAdditionalColumnsHidden);

  function syncVerticalScroll(event: UIEvent<HTMLElement>, target: HTMLElement | null) {
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
        aria-label="Публичная диаграмма Ганта"
        className="hidden min-h-0 flex-1 flex-col lg:flex"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--color-border)] bg-white px-5">
          <div aria-label="Масштаб временной шкалы" className="flex items-center gap-2" role="group">
            <span className="mr-1 text-sm text-[var(--color-text-muted)]">Масштаб</span>
            {([
              ['days', 'Дни'],
              ['weeks', 'Недели'],
              ['months', 'Месяцы'],
            ] as const).map(([scale, label]) => (
              <button
                aria-pressed={timelineScale === scale}
                className={`h-8 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${timelineScale === scale ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]' : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]'}`}
                key={scale}
                onClick={() => changeTimelineScale(scale)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="gantt-shell min-h-0 flex-1"
          data-columns-collapsed={areAdditionalColumnsHidden}
        >
          <section
            aria-label="Таблица задач"
            className="gantt-task-pane"
            onScroll={(event) => syncVerticalScroll(event, timelinePaneRef.current)}
            ref={taskPaneRef}
            tabIndex={0}
          >
            <div className="gantt-task-table" style={{ minWidth: taskTableMinWidth(columns.length, areAdditionalColumnsHidden) }}>
              <div className="sticky top-0 z-20 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]" style={{ height: GANTT_HEADER_HEIGHT }}>
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
                <div className="grid h-[58px]" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="grid place-items-center border-r border-[var(--color-border)] text-xs text-[var(--color-text-faint)]">№</div>
                  {columns.map((column) => (
                    <div className="flex min-w-0 items-center border-r border-[var(--color-border)] px-3 text-xs font-semibold" key={column.id} title={column.name}>
                      <span className="truncate">{column.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative bg-white">
                {rows.map((task, rowIndex) => (
                  <div
                    aria-hidden={task ? undefined : true}
                    className="grid border-b border-[var(--color-border)]"
                    key={task?.id ?? `empty-${rowIndex}`}
                    style={{ gridTemplateColumns: gridTemplate, height: GANTT_ROW_HEIGHT }}
                  >
                    <div className="grid place-items-center border-r border-[var(--color-border)] text-xs tabular-nums text-[var(--color-text-faint)]">
                      {task ? rowIndex + 1 : null}
                    </div>
                    {columns.map((column) => (
                      <div className="flex min-w-0 items-center border-r border-[var(--color-border)] px-3 text-xs" key={column.id}>
                        {task && column.key === 'title' ? (
                          <button
                            className="task-title-button min-w-0 truncate rounded-sm text-left focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                            onClick={() => onTaskDetails(task)}
                            style={{ marginLeft: task.level * 18 }}
                            type="button"
                          >
                            {task.title}
                          </button>
                        ) : task ? (
                          <span className="truncate" title={String(taskValue(task, column.key))}>
                            {String(taskValue(task, column.key))}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-label="Временная сетка" className="gantt-timeline-pane">
            <div
              aria-label="Горизонтальная прокрутка временной шкалы"
              className="gantt-timeline-scroll"
              onScroll={(event) => syncVerticalScroll(event, taskPaneRef.current)}
              ref={timelinePaneRef}
              role="region"
              tabIndex={0}
            >
              <div className="relative" data-timeline-scale={timelineScale} style={{ minWidth: timeline.width, width: timeline.width }}>
                <div className="sticky top-0 z-10 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]" style={{ height: GANTT_HEADER_HEIGHT }}>
                  {timelineScale === 'months' ? (
                    <>
                      <div className="flex h-[34px] border-b border-[var(--color-border)]">
                        {timeline.years.map((year) => <div className="flex shrink-0 items-center border-r border-[var(--color-border-strong)] px-2 text-xs font-semibold" key={year.key} style={{ width: year.dayCount * timeline.dayWidth }}><span className="sticky left-2">{year.label}</span></div>)}
                      </div>
                      <div className="flex h-[56px]">
                        {timeline.months.map((month) => <div className="flex shrink-0 items-center justify-center border-r border-[var(--color-border-strong)] px-2 text-[11px] font-medium text-[var(--color-text-muted)]" key={month.key} style={{ width: month.dayCount * timeline.dayWidth }} title={month.label}><span className="truncate">{month.label}</span></div>)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`flex border-b border-[var(--color-border)] ${timelineScale === 'days' ? 'h-[30px]' : 'h-10'}`}>
                        {timeline.months.map((month) => <div className="flex shrink-0 items-center justify-center border-r border-[var(--color-border-strong)] px-2 text-xs font-semibold" key={month.key} style={{ width: month.dayCount * timeline.dayWidth }} title={month.label}><span className="truncate">{month.label}</span></div>)}
                      </div>
                      <div className={`flex ${timelineScale === 'days' ? 'h-[26px] border-b border-[var(--color-border)]' : 'h-[50px]'}`}>
                        {timeline.weeks.map((week) => <div className="flex shrink-0 items-center justify-center border-r border-[var(--color-border)] px-1 text-[10px] text-[var(--color-text-muted)]" key={week.key} style={{ width: week.dayCount * timeline.dayWidth }}><span className="truncate">{week.label}</span></div>)}
                      </div>
                      {timelineScale === 'days' ? <div className="flex h-[34px]">
                        {timeline.days.map((day) => {
                          const nonWorkingDay = nonWorkingDaysByDate.get(day.date);
                          return <div className={`flex shrink-0 flex-col items-center justify-center border-r border-[var(--color-border)] text-[10px] ${nonWorkingDay ? 'bg-[var(--color-non-working)] text-[var(--color-warning)]' : day.isWeekend ? 'bg-[var(--color-weekend)] text-[var(--color-text-muted)]' : ''}`} key={day.date} style={{ width: timeline.dayWidth }} title={nonWorkingDay?.label ? `${day.date} — ${nonWorkingDay.label}` : day.date}><span className="font-semibold leading-none">{day.dayNumber}</span><span className="mt-0.5 text-[9px] leading-none">{day.weekday}</span></div>;
                        })}
                      </div> : null}
                    </>
                  )}
                </div>
                <div className="relative">
                  {rows.map((task, rowIndex) => (
                    <div className="relative flex border-b border-[var(--color-border)]" key={task?.id ?? `empty-${rowIndex}`} style={{ height: GANTT_ROW_HEIGHT }}>
                      {timeline.days.map((day, dayIndex) => {
                        const nonWorkingDay = nonWorkingDaysByDate.get(day.date);
                        const nextDay = timeline.days[dayIndex + 1];
                        const isGridBoundary = timelineScale === 'days'
                          || (timelineScale === 'weeks'
                            ? day.weekKey !== nextDay?.weekKey
                            : day.monthKey !== nextDay?.monthKey);
                        return <div className={`shrink-0 ${isGridBoundary ? 'border-r border-[var(--color-border)]' : ''} ${nonWorkingDay ? 'bg-[var(--color-non-working)]' : day.isWeekend ? 'bg-[var(--color-weekend)]' : 'bg-white'}`} key={day.date} style={{ width: timeline.dayWidth }} />;
                      })}
                      {task ? <ReadOnlyTaskBar dayWidth={timeline.dayWidth} onOpen={onTaskDetails} task={task} timelineEndDate={project.endDate} timelineStartDate={project.startDate} /> : null}
                    </div>
                  ))}
                </div>
                <MilestoneLayer dayWidth={timeline.dayWidth} milestones={milestones} timelineEndDate={project.endDate} timelineStartDate={project.startDate} />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid flex-1 place-items-center px-6 py-12 lg:hidden">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-accent)]"><Monitor aria-hidden className="size-5" /></div>
          <h2 className="mt-4 text-lg font-semibold">Увеличьте ширину окна</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Для просмотра таблицы и временной шкалы требуется окно шириной не менее 1024 пикселей.</p>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]"><CalendarDays aria-hidden className="size-4" />{project.startDate} — {project.endDate}</div>
        </div>
      </section>
    </>
  );
}
