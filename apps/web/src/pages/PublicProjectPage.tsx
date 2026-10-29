import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarRange, ChartNoAxesGantt, Eye } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { PublicGanttViewer } from '../features/public-share/PublicGanttViewer';
import { ReadOnlyTaskDetailsDialog } from '../features/public-share/ReadOnlyTaskDetailsDialog';
import { usePublicGantt } from '../features/public-share/public-share.queries';
import type { Task } from '../features/tasks/tasks.api';

function formatDate(value: string) {
  return format(parseISO(value), 'd MMMM yyyy', { locale: ru });
}

export function PublicProjectPage() {
  const { publicToken = '' } = useParams();
  const gantt = usePublicGantt(publicToken);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);

  if (gantt.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] text-sm text-[var(--color-text-muted)]" id="main-content">
        Загружаем публичный проект…
      </main>
    );
  }

  if (gantt.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] px-6 text-center" id="main-content">
        <div className="max-w-md">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-text-muted)]"><Eye aria-hidden className="size-5" /></div>
          <h1 className="mt-4 text-xl font-semibold">Публичный проект не найден</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Проверьте адрес ссылки или запросите её у владельца проекта повторно.</p>
        </div>
      </main>
    );
  }

  const { project, tasks, milestones, nonWorkingDays, stickers } = gantt.data;

  return (
    <main className="flex h-screen min-h-[560px] flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]" id="main-content">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-white">
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <div className="hidden items-center gap-2 border-r border-[var(--color-border)] pr-4 font-semibold sm:flex">
            <ChartNoAxesGantt aria-hidden className="size-5 text-[var(--color-accent)]" />
            SimpleGant
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold sm:text-lg">{project.name}</h1>
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--color-accent)] sm:flex"><Eye aria-hidden className="size-3" />Только просмотр</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--color-text-muted)]">
              <CalendarRange aria-hidden className="size-3.5 shrink-0" />
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </p>
          </div>
        </div>
      </header>

      <PublicGanttViewer milestones={milestones} nonWorkingDays={nonWorkingDays} onTaskDetails={setDetailsTask} project={project} stickers={stickers} tasks={tasks} />

      {detailsTask ? <ReadOnlyTaskDetailsDialog columns={project.columns} onClose={() => setDetailsTask(null)} task={detailsTask} /> : null}
    </main>
  );
}
