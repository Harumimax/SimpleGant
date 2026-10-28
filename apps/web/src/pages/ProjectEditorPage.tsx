import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, CalendarRange, ChartNoAxesGantt, Share2 } from 'lucide-react';
import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { NonWorkingDaysDialog } from '../features/calendar/NonWorkingDaysDialog';
import type { NonWorkingDayInput } from '../features/calendar/non-working-days.api';
import { normalizeDraftTaskDates } from '../features/gantt/draftDates';
import { saveGantt } from '../features/gantt/gantt.api';
import { ganttQueryKey, useGantt } from '../features/gantt/gantt.queries';
import { useGanttDraftStore } from '../features/gantt/gantt.store';
import { GanttWorkspace } from '../features/gantt/GanttWorkspace';
import {
  countTaskDescendants,
  recalculateParentTaskDates,
} from '../features/gantt/taskHierarchy';
import { calculateTaskDuration, type TaskDateRange } from '../features/gantt/timeline';
import { MilestonesDialog } from '../features/milestones/MilestonesDialog';
import type { MilestoneInput } from '../features/milestones/milestones.api';
import { ProjectColumnsDialog } from '../features/projects/ProjectColumnsDialog';
import { ShareProjectDialog } from '../features/projects/ShareProjectDialog';
import type { ProjectColumnConfigurationInput } from '../features/projects/projects.api';
import { DeleteTaskDialog } from '../features/tasks/DeleteTaskDialog';
import { TaskDetailsDialog } from '../features/tasks/TaskDetailsDialog';
import { TaskDialog } from '../features/tasks/TaskDialog';
import type { Task, TaskInput } from '../features/tasks/tasks.api';

function formatDate(value: string) {
  return format(parseISO(value), 'd MMMM yyyy', { locale: ru });
}

function customColumnKey(id: string) {
  return `custom_${id.replaceAll('-', '')}`;
}

function subtreeIds(tasks: Task[], rootId: string) {
  const ids = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const task of tasks) {
      if (task.parentId && ids.has(task.parentId) && !ids.has(task.id)) {
        ids.add(task.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function ProjectEditorPage() {
  const { projectId = '' } = useParams();
  const gantt = useGantt(projectId);
  const queryClient = useQueryClient();
  const draftProjectId = useGanttDraftStore((state) => state.projectId);
  const aggregate = useGanttDraftStore((state) => state.aggregate);
  const isDirty = useGanttDraftStore((state) => state.isDirty);
  const initialize = useGanttDraftStore((state) => state.initialize);
  const updateDraft = useGanttDraftStore((state) => state.update);
  const markSaved = useGanttDraftStore((state) => state.markSaved);
  const clearDraft = useGanttDraftStore((state) => state.clear);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [isNonWorkingDaysOpen, setIsNonWorkingDaysOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (gantt.data && draftProjectId !== projectId) initialize(gantt.data);
  }, [draftProjectId, gantt.data, initialize, projectId]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const current = useGanttDraftStore.getState().aggregate;
      if (!current) throw new Error('Черновик проекта не загружен');
      return saveGantt(projectId, current);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(ganttQueryKey(projectId), saved);
      markSaved(saved);
    },
  });

  const mutationMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Не удалось сохранить изменения';

  if (gantt.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] px-5 text-center text-[var(--color-text)]" id="main-content">
        <div>
          <h1 className="text-xl font-semibold">Проект не найден</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Возможно, он был удалён или принадлежит другому пользователю.</p>
          <Link className="mt-5 inline-flex h-11 items-center rounded-md border border-[var(--color-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--color-accent)]" to="/">Вернуться к проектам</Link>
        </div>
      </main>
    );
  }

  if (gantt.isPending || draftProjectId !== projectId || !aggregate) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] text-[var(--color-text-muted)]" id="main-content">
        <p className="text-sm">Загружаем проект…</p>
      </main>
    );
  }

  const { project, tasks, milestones, nonWorkingDays } = aggregate;
  const detailsTask = tasks.find(({ id }) => id === detailsTaskId) ?? null;
  const editingTask = tasks.find(({ id }) => id === editingTaskId) ?? null;
  const deletingTask = tasks.find(({ id }) => id === deletingTaskId) ?? null;

  function confirmNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (isDirty) {
      if (!window.confirm('Есть несохранённые изменения. Выйти без сохранения?')) {
        event.preventDefault();
        return;
      }
      clearDraft();
    }
  }

  function createTask(input: TaskInput) {
    updateDraft((current) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const dates = normalizeDraftTaskDates(
        input.startDate,
        input.endDate,
        input.duration,
        input.excludeWeekends ?? true,
        current.nonWorkingDays,
      );
      const task: Task = {
        id,
        projectId,
        parentId: null,
        orderIndex: current.tasks.filter(({ parentId }) => parentId === null).length,
        level: 0,
        title: input.title,
        workType: input.workType ?? null,
        assignee: input.assignee ?? '',
        estimate: input.estimate ?? null,
        comment: input.comment ?? null,
        duration: calculateTaskDuration(dates.startDate, dates.endDate),
        status: input.status,
        startDate: dates.startDate,
        endDate: dates.endDate,
        color: input.color ?? 'sage',
        isCollapsed: false,
        customFields: input.customFields ?? {},
        createdAt: now,
        updatedAt: now,
      };
      return { ...current, tasks: [...current.tasks, task] };
    });
    setIsCreateOpen(false);
  }

  function updateTask(taskId: string, input: TaskInput) {
    updateDraft((current) => ({
      ...current,
      tasks: recalculateParentTaskDates(current.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const dates = input.startDate !== undefined || input.endDate !== undefined
          ? normalizeDraftTaskDates(
              input.startDate,
              input.endDate,
              input.duration,
              false,
              current.nonWorkingDays,
            )
          : { startDate: task.startDate, endDate: task.endDate };
        return {
          ...task,
          title: input.title,
          workType: input.workType ?? null,
          assignee: input.assignee ?? '',
          estimate: input.estimate ?? null,
          comment: input.comment ?? null,
          status: input.status,
          color: input.color ?? task.color,
          customFields: input.customFields ?? {},
          ...dates,
          duration: calculateTaskDuration(dates.startDate, dates.endDate),
          updatedAt: new Date().toISOString(),
        };
      })),
    }));
    setEditingTaskId(null);
  }

  function deleteTask(taskId: string) {
    updateDraft((current) => {
      const removed = subtreeIds(current.tasks, taskId);
      return {
        ...current,
        tasks: recalculateParentTaskDates(
          current.tasks.filter(({ id }) => !removed.has(id)),
        ),
      };
    });
    setDeletingTaskId(null);
  }

  function configureColumns(configurations: ProjectColumnConfigurationInput[]) {
    updateDraft((current) => {
      const existing = new Map(current.project.columns.map((column) => [column.id, column]));
      const columns = configurations.map((configuration, orderIndex) => {
        const id = configuration.id ?? crypto.randomUUID();
        const previous = existing.get(id);
        return {
          id,
          name: configuration.name,
          key: previous?.key ?? customColumnKey(id),
          orderIndex,
          isVisible: configuration.isVisible,
          isDefault: previous?.isDefault ?? false,
        };
      });
      const customKeys = new Set(columns.filter(({ isDefault }) => !isDefault).map(({ key }) => key));
      return {
        ...current,
        project: { ...current.project, columns },
        tasks: current.tasks.map((task) => ({
          ...task,
          customFields: Object.fromEntries(
            Object.entries(task.customFields).filter(([key]) => customKeys.has(key)),
          ),
        })),
      };
    });
    setIsColumnsOpen(false);
  }

  function saveMilestone(input: MilestoneInput, milestoneId?: string) {
    const now = new Date().toISOString();
    updateDraft((current) => ({
      ...current,
      milestones: milestoneId
        ? current.milestones.map((milestone) => milestone.id === milestoneId
          ? { ...milestone, ...input, updatedAt: now }
          : milestone)
        : [...current.milestones, {
            id: crypto.randomUUID(),
            projectId,
            ...input,
            createdAt: now,
            updatedAt: now,
          }],
    }));
    setIsMilestonesOpen(false);
  }

  function deleteMilestone(id: string) {
    updateDraft((current) => ({
      ...current,
      milestones: current.milestones.filter((milestone) => milestone.id !== id),
    }));
    setIsMilestonesOpen(false);
  }

  function addNonWorkingDay(input: NonWorkingDayInput) {
    const now = new Date().toISOString();
    updateDraft((current) => ({
      ...current,
      nonWorkingDays: [...current.nonWorkingDays, {
        id: crypto.randomUUID(),
        projectId,
        date: input.date,
        label: input.label ?? null,
        createdAt: now,
        updatedAt: now,
      }].sort((left, right) => left.date.localeCompare(right.date)),
    }));
  }

  function deleteNonWorkingDay(id: string) {
    updateDraft((current) => ({
      ...current,
      nonWorkingDays: current.nonWorkingDays.filter((day) => day.id !== id),
    }));
  }

  return (
    <main className="flex h-screen min-h-[560px] flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]" id="main-content">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-white">
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <Link aria-label="Назад к проектам" className="grid size-11 shrink-0 place-items-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]" onClick={confirmNavigation} to="/">
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
          <div className="hidden items-center gap-2 border-r border-[var(--color-border)] pr-4 font-semibold sm:flex">
            <ChartNoAxesGantt aria-hidden className="size-5 text-[var(--color-accent)]" />
            SimpleGant
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">{project.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--color-text-muted)]">
              <CalendarRange aria-hidden className="size-3.5 shrink-0" />
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </p>
          </div>
          {project.publicToken ? (
            <button
              className="ml-auto flex h-9 shrink-0 items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onClick={() => setIsShareOpen(true)}
              type="button"
            >
              <Share2 aria-hidden className="size-4" />
              Поделиться
            </button>
          ) : null}
        </div>
      </header>

      <GanttWorkspace
        isDirty={isDirty}
        isSaving={saveMutation.isPending}
        milestones={milestones}
        nonWorkingDays={nonWorkingDays}
        onAddTask={() => setIsCreateOpen(true)}
        onConfigureColumns={() => setIsColumnsOpen(true)}
        onConfigureMilestones={() => setIsMilestonesOpen(true)}
        onConfigureNonWorkingDays={() => setIsNonWorkingDaysOpen(true)}
        onSave={() => saveMutation.mutate()}
        onTaskDatesChange={async (task, dates: TaskDateRange) => {
          updateDraft((current) => ({
            ...current,
            tasks: recalculateParentTaskDates(current.tasks.map((item) => item.id === task.id
              ? { ...item, ...dates, duration: calculateTaskDuration(dates.startDate, dates.endDate) }
              : item)),
          }));
        }}
        onTaskDetails={(task) => setDetailsTaskId(task.id)}
        onTaskOrderChange={async (nextTasks) => {
          updateDraft((current) => ({ ...current, tasks: nextTasks }));
        }}
        onToggleTaskCollapsed={async (task) => {
          updateDraft((current) => ({
            ...current,
            tasks: current.tasks.map((item) => item.id === task.id
              ? { ...item, isCollapsed: !item.isCollapsed }
              : item),
          }));
        }}
        project={project}
        saveError={saveMutation.isError ? mutationMessage(saveMutation.error) : undefined}
        tasks={tasks}
      />

      {isCreateOpen ? <TaskDialog columns={project.columns} isPending={false} onClose={() => setIsCreateOpen(false)} onSubmit={createTask} /> : null}
      {detailsTask ? <TaskDetailsDialog onClose={() => setDetailsTaskId(null)} onDelete={() => { setDetailsTaskId(null); setDeletingTaskId(detailsTask.id); }} onEdit={() => { setDetailsTaskId(null); setEditingTaskId(detailsTask.id); }} task={detailsTask} /> : null}
      {editingTask ? <TaskDialog columns={project.columns} datesReadOnly={countTaskDescendants(tasks, editingTask.id) > 0} isPending={false} onClose={() => setEditingTaskId(null)} onSubmit={(input) => updateTask(editingTask.id, input)} task={editingTask} /> : null}
      {deletingTask ? <DeleteTaskDialog descendantCount={countTaskDescendants(tasks, deletingTask.id)} isPending={false} onClose={() => setDeletingTaskId(null)} onConfirm={() => deleteTask(deletingTask.id)} task={deletingTask} /> : null}
      {isColumnsOpen ? <ProjectColumnsDialog columns={project.columns} isPending={false} onClose={() => setIsColumnsOpen(false)} onSubmit={configureColumns} /> : null}
      {isMilestonesOpen ? <MilestonesDialog isPending={false} milestones={milestones} onClose={() => setIsMilestonesOpen(false)} onDelete={deleteMilestone} onSave={saveMilestone} projectEndDate={project.endDate} projectStartDate={project.startDate} /> : null}
      {isNonWorkingDaysOpen ? <NonWorkingDaysDialog days={nonWorkingDays} isPending={false} onAdd={addNonWorkingDay} onClose={() => setIsNonWorkingDaysOpen(false)} onDelete={deleteNonWorkingDay} projectEndDate={project.endDate} projectStartDate={project.startDate} /> : null}
      {isShareOpen && project.publicToken ? <ShareProjectDialog onClose={() => setIsShareOpen(false)} publicUrl={`${window.location.origin}/public/${project.publicToken}`} /> : null}
    </main>
  );
}
