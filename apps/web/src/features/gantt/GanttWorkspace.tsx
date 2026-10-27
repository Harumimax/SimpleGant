import { CalendarDays, Monitor, Plus } from 'lucide-react';

import type { ProjectDetail } from '../projects/projects.api';
import {
  buildTimeline,
  GANTT_DAY_WIDTH,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
} from './timeline';

const EMPTY_ROWS = Array.from({ length: 20 }, (_, index) => index + 1);

type GanttWorkspaceProps = {
  project: ProjectDetail;
};

function columnTemplate(columnCount: number) {
  const extraColumns = Math.max(columnCount - 1, 0);
  return `42px minmax(190px, 2fr) repeat(${extraColumns}, minmax(104px, 1fr))`;
}

export function GanttWorkspace({ project }: GanttWorkspaceProps) {
  const timeline = buildTimeline(project.startDate, project.endDate);
  const columns = project.columns
    .filter(({ isVisible }) => isVisible)
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const taskGridTemplate = columnTemplate(columns.length);

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

          <button
            className="flex h-9 items-center gap-2 rounded-md border border-[var(--color-border-strong)] px-3 text-sm font-semibold text-[var(--color-text-muted)] opacity-55"
            disabled
            title="Создание задач будет реализовано следующим шагом"
            type="button"
          >
            <Plus aria-hidden className="size-4" />
            Добавить задачу
          </button>
        </div>

        <div className="gantt-shell min-h-0 flex-1">
          <section className="gantt-task-pane" aria-label="Таблица задач">
            <div
              className="border-b border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)]"
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
              </div>
            </div>

            <div className="relative bg-white">
              {EMPTY_ROWS.map((rowNumber) => (
                <div
                  aria-hidden="true"
                  className="grid border-b border-[var(--color-border)]"
                  key={rowNumber}
                  style={{
                    gridTemplateColumns: taskGridTemplate,
                    height: GANTT_ROW_HEIGHT,
                  }}
                >
                  <div className="border-r border-[var(--color-border)]" />
                  {columns.map((column) => (
                    <div
                      className="border-r border-[var(--color-border)] last:border-r-0"
                      key={column.id}
                    />
                  ))}
                </div>
              ))}

              <div className="pointer-events-none absolute inset-x-8 top-20 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-white/95 px-5 py-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  В проекте пока нет задач
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                  Здесь появятся строки задач и их поля.
                </p>
              </div>
            </div>
          </section>

          <section className="gantt-timeline-pane" aria-label="Временная сетка">
            <div
              aria-label="Горизонтальная прокрутка временной шкалы"
              className="gantt-timeline-scroll focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
              role="region"
              tabIndex={0}
            >
              <div style={{ minWidth: timeline.width, width: timeline.width }}>
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
                  {EMPTY_ROWS.map((rowNumber) => (
                    <div
                      aria-hidden="true"
                      className="flex border-b border-[var(--color-border)]"
                      key={rowNumber}
                      style={{ height: GANTT_ROW_HEIGHT }}
                    >
                      {timeline.days.map((day) => (
                        <div
                          className={`shrink-0 border-r border-[var(--color-border)] ${day.isWeekend ? 'bg-[var(--color-weekend)]' : 'bg-white'}`}
                          key={day.date}
                          style={{ width: GANTT_DAY_WIDTH }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
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
