import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, CalendarRange, ChartNoAxesGantt } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { GanttWorkspace } from '../features/gantt/GanttWorkspace';
import { useProject } from '../features/projects/projects.queries';

function formatDate(value: string) {
  return format(parseISO(value), 'd MMMM yyyy', { locale: ru });
}

export function ProjectEditorPage() {
  const { projectId = '' } = useParams();
  const project = useProject(projectId);

  if (project.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] text-[var(--color-text-muted)]">
        <p className="text-sm">Загружаем проект…</p>
      </main>
    );
  }

  if (project.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] px-5 text-center text-[var(--color-text)]">
        <div>
          <h1 className="text-xl font-semibold">Проект не найден</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Возможно, он был удалён или принадлежит другому пользователю.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center rounded-md border border-[var(--color-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--color-accent)]"
            to="/"
          >
            Вернуться к проектам
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen min-h-[560px] flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-white">
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <Link
            aria-label="Назад к проектам"
            className="grid size-11 shrink-0 place-items-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            to="/"
          >
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
          <div className="hidden items-center gap-2 border-r border-[var(--color-border)] pr-4 font-semibold sm:flex">
            <ChartNoAxesGantt aria-hidden className="size-5 text-[var(--color-accent)]" />
            SimpleGant
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {project.data.name}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--color-text-muted)]">
              <CalendarRange aria-hidden className="size-3.5 shrink-0" />
              {formatDate(project.data.startDate)} — {formatDate(project.data.endDate)}
            </p>
          </div>
        </div>
      </header>

      <GanttWorkspace project={project.data} />
    </main>
  );
}
