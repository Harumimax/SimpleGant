import { CalendarDays, Monitor } from 'lucide-react';
import { useRef, type UIEvent } from 'react';

import type { GanttAggregate } from '../gantt/gantt.api';
import { MilestoneLayer } from '../gantt/MilestoneLayer';
import { flattenVisibleTasks } from '../gantt/taskHierarchy';
import { taskValue } from '../gantt/taskValue';
import {
  buildTimeline,
  GANTT_DAY_WIDTH,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
} from '../gantt/timeline';
import type { Task } from '../tasks/tasks.api';
import { ReadOnlyTaskBar } from './ReadOnlyTaskBar';

type Props = GanttAggregate & {
  onTaskDetails: (task: Task) => void;
};

function columnTemplate(columnCount: number) {
  if (columnCount === 0) return '42px';
  return `42px minmax(210px, 2fr) repeat(${Math.max(columnCount - 1, 0)}, minmax(110px, 1fr))`;
}

function taskTableMinWidth(columnCount: number) {
  if (columnCount === 0) return 42;
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
  const columns = [...project.columns]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .filter(({ isVisible }) => isVisible);
  const timeline = buildTimeline(project.startDate, project.endDate);
  const visibleTasks = flattenVisibleTasks(tasks);
  const rows: Array<Task | null> = [
    ...visibleTasks,
    ...Array.from({ length: Math.max(20 - visibleTasks.length, 0) }, () => null),
  ];
  const nonWorkingDaysByDate = new Map(
    nonWorkingDays.map((day) => [day.date, day]),
  );
  const gridTemplate = columnTemplate(columns.length);

  function syncVerticalScroll(event: UIEvent<HTMLElement>, target: HTMLElement | null) {
    if (target && target.scrollTop !== event.currentTarget.scrollTop) {
      target.scrollTop = event.currentTarget.scrollTop;
    }
  }

  return (
    <>
      <section
        aria-label="Публичная диаграмма Ганта"
        className="hidden min-h-0 flex-1 lg:block"
      >
        <div className="gantt-shell h-full min-h-0">
          <section
            aria-label="Таблица задач"
            className="gantt-task-pane"
            onScroll={(event) => syncVerticalScroll(event, timelinePaneRef.current)}
            ref={taskPaneRef}
            tabIndex={0}
          >
            <div className="gantt-task-table" style={{ minWidth: taskTableMinWidth(columns.length) }}>
              <div className="sticky top-0 z-20 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]" style={{ height: GANTT_HEADER_HEIGHT }}>
                <div className="flex h-8 items-center border-b border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-muted)]">
                  Структура проекта
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
              <div className="relative" style={{ minWidth: timeline.width, width: timeline.width }}>
                <div className="sticky top-0 z-10 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]" style={{ height: GANTT_HEADER_HEIGHT }}>
                  <div className="flex h-[30px] border-b border-[var(--color-border)]">
                    {timeline.months.map((month) => <div className="flex items-center justify-center border-r border-[var(--color-border-strong)] px-2 text-xs font-semibold" key={month.key} style={{ width: month.dayCount * GANTT_DAY_WIDTH }}>{month.label}</div>)}
                  </div>
                  <div className="flex h-[26px] border-b border-[var(--color-border)]">
                    {timeline.weeks.map((week) => <div className="flex items-center justify-center border-r border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]" key={week.key} style={{ width: week.dayCount * GANTT_DAY_WIDTH }}>{week.label}</div>)}
                  </div>
                  <div className="flex h-[34px]">
                    {timeline.days.map((day) => {
                      const nonWorkingDay = nonWorkingDaysByDate.get(day.date);
                      return <div className={`flex shrink-0 flex-col items-center justify-center border-r border-[var(--color-border)] text-[10px] ${nonWorkingDay ? 'bg-[var(--color-non-working)] text-[var(--color-warning)]' : day.isWeekend ? 'bg-[var(--color-weekend)] text-[var(--color-text-muted)]' : ''}`} key={day.date} style={{ width: GANTT_DAY_WIDTH }} title={nonWorkingDay?.label ? `${day.date} — ${nonWorkingDay.label}` : day.date}><span className="font-semibold leading-none">{day.dayNumber}</span><span className="mt-0.5 text-[9px] leading-none">{day.weekday}</span></div>;
                    })}
                  </div>
                </div>
                <div className="relative">
                  {rows.map((task, rowIndex) => (
                    <div className="relative flex border-b border-[var(--color-border)]" key={task?.id ?? `empty-${rowIndex}`} style={{ height: GANTT_ROW_HEIGHT }}>
                      {timeline.days.map((day) => {
                        const nonWorkingDay = nonWorkingDaysByDate.get(day.date);
                        return <div className={`shrink-0 border-r border-[var(--color-border)] ${nonWorkingDay ? 'bg-[var(--color-non-working)]' : day.isWeekend ? 'bg-[var(--color-weekend)]' : 'bg-white'}`} key={day.date} style={{ width: GANTT_DAY_WIDTH }} />;
                      })}
                      {task ? <ReadOnlyTaskBar onOpen={onTaskDetails} task={task} timelineEndDate={project.endDate} timelineStartDate={project.startDate} /> : null}
                    </div>
                  ))}
                </div>
                <MilestoneLayer milestones={milestones} timelineEndDate={project.endDate} timelineStartDate={project.startDate} />
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
