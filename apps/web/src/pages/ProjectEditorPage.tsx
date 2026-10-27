import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, CalendarRange, ChartNoAxesGantt } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import { GanttWorkspace } from '../features/gantt/GanttWorkspace';
import {
  countTaskDescendants,
  recalculateParentTaskDates,
  toTaskPositions,
} from '../features/gantt/taskHierarchy';
import type { TaskDateRange } from '../features/gantt/timeline';
import { MilestonesDialog } from '../features/milestones/MilestonesDialog';
import {
  createMilestone,
  deleteMilestone,
  updateMilestone,
  type MilestoneInput,
} from '../features/milestones/milestones.api';
import {
  milestonesQueryKey,
  useMilestones,
} from '../features/milestones/milestones.queries';
import { useProject } from '../features/projects/projects.queries';
import {
  configureProjectColumns,
  type ProjectColumnConfigurationInput,
  type ProjectDetail,
} from '../features/projects/projects.api';
import { ProjectColumnsDialog } from '../features/projects/ProjectColumnsDialog';
import { projectQueryKey } from '../features/projects/projects.queries';
import { DeleteTaskDialog } from '../features/tasks/DeleteTaskDialog';
import { TaskDetailsDialog } from '../features/tasks/TaskDetailsDialog';
import { TaskDialog } from '../features/tasks/TaskDialog';
import {
  createTask,
  deleteTask,
  reorderTasks,
  updateTask,
  type Task,
  type TaskInput,
} from '../features/tasks/tasks.api';
import { tasksQueryKey, useTasks } from '../features/tasks/tasks.queries';

function formatDate(value: string) {
  return format(parseISO(value), 'd MMMM yyyy', { locale: ru });
}

export function ProjectEditorPage() {
  const { projectId = '' } = useParams();
  const project = useProject(projectId);
  const tasks = useTasks(projectId);
  const milestones = useMilestones(projectId);
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (input: TaskInput) => createTask(projectId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
      setIsCreateOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => updateTask(projectId, id, input),
    onSuccess: (updatedTasks) => {
      queryClient.setQueryData(tasksQueryKey(projectId), updatedTasks);
      setEditingTask(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(projectId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
      setDeletingTask(null);
    },
  });
  const dateMutation = useMutation({
    mutationFn: ({ task, dates }: { task: Task; dates: TaskDateRange }) =>
      updateTask(projectId, task.id, dates),
    onMutate: async ({ task, dates }) => {
      const queryKey = tasksQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
        recalculateParentTaskDates(
          current.map((item) =>
            item.id === task.id ? { ...item, ...dates } : item,
          ),
        ),
      );
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          tasksQueryKey(projectId),
          context.previousTasks,
        );
      }
    },
    onSuccess: (updatedTasks) => {
      queryClient.setQueryData(tasksQueryKey(projectId), updatedTasks);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKey(projectId),
      });
    },
  });
  const structureMutation = useMutation({
    mutationFn: (nextTasks: Task[]) =>
      reorderTasks(projectId, toTaskPositions(nextTasks)),
    onMutate: async (nextTasks) => {
      const queryKey = tasksQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData(queryKey, nextTasks);
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          tasksQueryKey(projectId),
          context.previousTasks,
        );
      }
    },
    onSuccess: (updatedTasks) => {
      queryClient.setQueryData(tasksQueryKey(projectId), updatedTasks);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKey(projectId),
      });
    },
  });
  const collapseMutation = useMutation({
    mutationFn: (task: Task) =>
      updateTask(projectId, task.id, {
        isCollapsed: !task.isCollapsed,
      }),
    onMutate: async (task) => {
      const queryKey = tasksQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, isCollapsed: !item.isCollapsed }
            : item,
        ),
      );
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          tasksQueryKey(projectId),
          context.previousTasks,
        );
      }
    },
    onSuccess: (updatedTasks) => {
      queryClient.setQueryData(tasksQueryKey(projectId), updatedTasks);
    },
  });
  const columnsMutation = useMutation({
    mutationFn: (columns: ProjectColumnConfigurationInput[]) =>
      configureProjectColumns(projectId, columns),
    onSuccess: async (columns) => {
      queryClient.setQueryData<ProjectDetail>(
        projectQueryKey(projectId),
        (current) => current ? { ...current, columns } : current,
      );
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
      setIsColumnsOpen(false);
    },
  });
  const createMilestoneMutation = useMutation({
    mutationFn: (input: MilestoneInput) => createMilestone(projectId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: milestonesQueryKey(projectId) });
      setIsMilestonesOpen(false);
    },
  });
  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MilestoneInput }) =>
      updateMilestone(projectId, id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: milestonesQueryKey(projectId) });
      setIsMilestonesOpen(false);
    },
  });
  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: string) => deleteMilestone(projectId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: milestonesQueryKey(projectId) });
      setIsMilestonesOpen(false);
    },
  });

  const mutationMessage = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить действие';

  if (project.isPending || tasks.isPending || milestones.isPending) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-[var(--color-canvas)] text-[var(--color-text-muted)]"
        id="main-content"
      >
        <p className="text-sm">Загружаем проект…</p>
      </main>
    );
  }

  if (project.isError || tasks.isError || milestones.isError) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-[var(--color-canvas)] px-5 text-center text-[var(--color-text)]"
        id="main-content"
      >
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
    <main
      className="flex h-screen min-h-[560px] flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]"
      id="main-content"
    >
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

      <GanttWorkspace
        dateChangeError={
          dateMutation.isError ? mutationMessage(dateMutation.error) : undefined
        }
        onAddTask={() => { createMutation.reset(); setIsCreateOpen(true); }}
        onConfigureColumns={() => { columnsMutation.reset(); setIsColumnsOpen(true); }}
        onConfigureMilestones={() => {
          createMilestoneMutation.reset();
          updateMilestoneMutation.reset();
          deleteMilestoneMutation.reset();
          setIsMilestonesOpen(true);
        }}
        onTaskDatesChange={async (task, dates) => {
          dateMutation.reset();
          await dateMutation.mutateAsync({ task, dates });
        }}
        onTaskDetails={setDetailsTask}
        onTaskOrderChange={async (nextTasks) => {
          structureMutation.reset();
          await structureMutation.mutateAsync(nextTasks);
        }}
        onToggleTaskCollapsed={async (task) => {
          collapseMutation.reset();
          await collapseMutation.mutateAsync(task);
        }}
        project={project.data}
        milestones={milestones.data}
        isSavingStructure={
          structureMutation.isPending || collapseMutation.isPending
        }
        structureChangeError={
          structureMutation.isError
            ? mutationMessage(structureMutation.error)
            : collapseMutation.isError
              ? mutationMessage(collapseMutation.error)
              : undefined
        }
        tasks={tasks.data}
        updatingTaskId={
          dateMutation.isPending ? dateMutation.variables?.task.id : undefined
        }
      />

      {isCreateOpen ? <TaskDialog columns={project.data.columns} isPending={createMutation.isPending} onClose={() => setIsCreateOpen(false)} onSubmit={(input) => createMutation.mutate(input)} serverError={createMutation.isError ? mutationMessage(createMutation.error) : undefined} /> : null}
      {detailsTask ? <TaskDetailsDialog onClose={() => setDetailsTask(null)} onDelete={() => { deleteMutation.reset(); setDetailsTask(null); setDeletingTask(detailsTask); }} onEdit={() => { updateMutation.reset(); setDetailsTask(null); setEditingTask(detailsTask); }} task={detailsTask} /> : null}
      {editingTask ? <TaskDialog columns={project.data.columns} datesReadOnly={countTaskDescendants(tasks.data, editingTask.id) > 0} isPending={updateMutation.isPending} onClose={() => setEditingTask(null)} onSubmit={(input) => updateMutation.mutate({ id: editingTask.id, input })} serverError={updateMutation.isError ? mutationMessage(updateMutation.error) : undefined} task={editingTask} /> : null}
      {deletingTask ? <DeleteTaskDialog descendantCount={countTaskDescendants(tasks.data, deletingTask.id)} isPending={deleteMutation.isPending} onClose={() => setDeletingTask(null)} onConfirm={() => deleteMutation.mutate(deletingTask.id)} serverError={deleteMutation.isError ? mutationMessage(deleteMutation.error) : undefined} task={deletingTask} /> : null}
      {isColumnsOpen ? <ProjectColumnsDialog columns={project.data.columns} isPending={columnsMutation.isPending} onClose={() => setIsColumnsOpen(false)} onSubmit={(columns) => columnsMutation.mutate(columns)} serverError={columnsMutation.isError ? mutationMessage(columnsMutation.error) : undefined} /> : null}
      {isMilestonesOpen ? <MilestonesDialog isPending={createMilestoneMutation.isPending || updateMilestoneMutation.isPending || deleteMilestoneMutation.isPending} milestones={milestones.data} onClose={() => setIsMilestonesOpen(false)} onDelete={(id) => deleteMilestoneMutation.mutate(id)} onSave={(input, id) => id ? updateMilestoneMutation.mutate({ id, input }) : createMilestoneMutation.mutate(input)} projectEndDate={project.data.endDate} projectStartDate={project.data.startDate} serverError={createMilestoneMutation.isError ? mutationMessage(createMilestoneMutation.error) : updateMilestoneMutation.isError ? mutationMessage(updateMilestoneMutation.error) : deleteMilestoneMutation.isError ? mutationMessage(deleteMilestoneMutation.error) : undefined} /> : null}
    </main>
  );
}
