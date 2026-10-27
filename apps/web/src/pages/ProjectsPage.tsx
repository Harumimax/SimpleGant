import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CalendarRange,
  FolderKanban,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppHeader } from '../components/ui/AppHeader';
import { Button } from '../components/ui/Button';
import { buttonClassName } from '../components/ui/button.styles';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { logout } from '../features/auth/auth.api';
import { currentUserQueryKey, useCurrentUser } from '../features/auth/auth.queries';
import { DeleteProjectDialog } from '../features/projects/DeleteProjectDialog';
import { ProjectDialog } from '../features/projects/ProjectDialog';
import {
  createProject,
  deleteProject,
  updateProject,
  type Project,
  type ProjectInput,
} from '../features/projects/projects.api';
import {
  projectsQueryKey,
  useProjects,
} from '../features/projects/projects.queries';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function mutationMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function ProjectsPage() {
  const currentUser = useCurrentUser();
  const projects = useProjects();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(currentUserQueryKey, null);
      navigate('/login', { replace: true });
    },
  });
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
      setIsCreateOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) =>
      updateProject(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
      setEditingProject(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
      setDeletingProject(null);
    },
  });

  function openCreate() {
    createMutation.reset();
    setIsCreateOpen(true);
  }

  function openEdit(project: Project) {
    updateMutation.reset();
    setEditingProject(project);
  }

  function openDelete(project: Project) {
    deleteMutation.reset();
    setDeletingProject(project);
  }

  return (
    <main
      className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)]"
      id="main-content"
    >
      <AppHeader
        email={currentUser.data?.email}
        isLoggingOut={logoutMutation.isPending}
        onLogout={() => logoutMutation.mutate()}
      />

      <section className="mx-auto max-w-[var(--container-content)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-balance sm:text-[32px]">
              Проекты
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Все рабочие планы и диаграммы Ганта в одном месте.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={openCreate} type="button">
            <Plus aria-hidden className="size-4" />
            Создать проект
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgb(23_35_31_/_3%)]">
          {projects.isPending ? (
            <LoadingState />
          ) : projects.isError ? (
            <EmptyState
              action={
                <Button onClick={() => projects.refetch()} variant="secondary">
                  Повторить загрузку
                </Button>
              }
              description="Проверьте подключение к серверу и повторите попытку."
              icon={<AlertCircle aria-hidden className="size-5" />}
              title="Не удалось загрузить проекты"
            />
          ) : projects.data.length === 0 ? (
            <EmptyState
              action={
                <Button onClick={openCreate}>
                  <Plus aria-hidden className="size-4" />
                  Создать первый проект
                </Button>
              }
              description="Укажите название и период — стандартные колонки для задач появятся автоматически."
              icon={<FolderOpen aria-hidden className="size-5" />}
              title="Начните с первого проекта"
            />
          ) : (
            <div>
              <div className="hidden grid-cols-[minmax(0,1fr)_240px_224px] gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] md:grid">
                <span>Название</span>
                <span>Период</span>
                <span className="sr-only">Действия</span>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {projects.data.map((project) => (
                  <article
                    className="grid gap-4 px-4 py-4 transition-[background-color] duration-150 hover:bg-[var(--color-surface-hover)] sm:px-5 md:grid-cols-[minmax(0,1fr)_240px_224px] md:items-center"
                    key={project.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                        <FolderKanban aria-hidden className="size-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-[var(--color-text)]">
                          <Link
                            className="rounded-sm hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2"
                            to={`/projects/${project.id}`}
                          >
                            {project.name}
                          </Link>
                        </h2>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          Обновлён {formatDate(project.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] md:min-w-0">
                      <CalendarRange
                        aria-hidden
                        className="size-4 shrink-0 text-[var(--color-text-faint)]"
                      />
                      <span className="min-w-0 flex-1 truncate tabular-nums">
                        {formatDate(project.startDate)} — {formatDate(project.endDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 md:justify-end">
                      <Link
                        className={buttonClassName({
                          variant: 'secondary',
                          className: 'mr-1',
                        })}
                        to={`/projects/${project.id}`}
                      >
                        Открыть
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                      <Button
                        aria-label={`Редактировать ${project.name}`}
                        onClick={() => openEdit(project)}
                        size="icon"
                        title="Редактировать"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil aria-hidden className="size-4" />
                      </Button>
                      <Button
                        aria-label={`Удалить ${project.name}`}
                        className="hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                        onClick={() => openDelete(project)}
                        size="icon"
                        title="Удалить"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {isCreateOpen ? (
        <ProjectDialog
          isPending={createMutation.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(input) => createMutation.mutate(input)}
          serverError={
            createMutation.isError
              ? mutationMessage(createMutation.error)
              : undefined
          }
        />
      ) : null}
      {editingProject ? (
        <ProjectDialog
          isPending={updateMutation.isPending}
          onClose={() => setEditingProject(null)}
          onSubmit={(input) =>
            updateMutation.mutate({ id: editingProject.id, input })
          }
          project={editingProject}
          serverError={
            updateMutation.isError
              ? mutationMessage(updateMutation.error)
              : undefined
          }
        />
      ) : null}
      {deletingProject ? (
        <DeleteProjectDialog
          isPending={deleteMutation.isPending}
          onClose={() => setDeletingProject(null)}
          onConfirm={() => deleteMutation.mutate(deletingProject.id)}
          project={deletingProject}
          serverError={
            deleteMutation.isError
              ? mutationMessage(deleteMutation.error)
              : undefined
          }
        />
      ) : null}
    </main>
  );
}
