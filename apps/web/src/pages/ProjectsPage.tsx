import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ArrowRight,
  CalendarRange,
  ChartNoAxesGantt,
  FolderOpen,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logout } from '../features/auth/auth.api';
import { currentUserQueryKey, useCurrentUser } from '../features/auth/auth.queries';
import { DeleteProjectDialog } from '../features/projects/DeleteProjectDialog';
import { ProjectDialog } from '../features/projects/ProjectDialog';
import { createProject, deleteProject, updateProject, type Project, type ProjectInput } from '../features/projects/projects.api';
import { projectsQueryKey, useProjects } from '../features/projects/projects.queries';

function mutationMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить действие';
}

function formatDate(value: string) {
  return format(parseISO(value), 'd MMM yyyy', { locale: ru });
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
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) => updateProject(id, input),
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
    <main className="min-h-screen bg-[#f4f6f3] text-[#18231f]">
      <header className="border-b border-[#dce2de] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ChartNoAxesGantt aria-hidden className="size-5 text-[#286b59]" />
            SimpleGant
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-56 truncate text-sm text-[#607069] sm:block">{currentUser.data?.email}</span>
            <button aria-label="Выйти" className="grid size-11 place-items-center rounded-md text-[#51615a] hover:bg-[#eef2ef] hover:text-[#18231f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] disabled:opacity-50" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()} title="Выйти" type="button">
              <LogOut aria-hidden className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col items-start justify-between gap-5 border-b border-[#d4dcd7] pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Проекты</h1>
            <p className="mt-1 text-sm text-[#607069]">Рабочие планы и диаграммы Ганта.</p>
          </div>
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#286b59] px-4 text-sm font-semibold text-white hover:bg-[#215949] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] sm:w-auto" onClick={openCreate} type="button">
            <Plus aria-hidden className="size-4" />
            Создать проект
          </button>
        </div>

        {projects.isPending ? (
          <div aria-label="Загрузка проектов" className="divide-y divide-[#e1e6e3]">
            {[0, 1, 2].map((item) => <div className="h-24 animate-pulse bg-white/35" key={item} />)}
          </div>
        ) : projects.isError ? (
          <div className="border-b border-[#e1e6e3] py-14 text-center">
            <p className="text-sm font-semibold">Не удалось загрузить проекты</p>
            <button className="mt-3 h-11 rounded-md border border-[#cbd5d0] px-4 text-sm font-semibold hover:bg-white" onClick={() => projects.refetch()} type="button">Повторить</button>
          </div>
        ) : projects.data.length === 0 ? (
          <div className="grid min-h-80 place-items-center border-b border-[#e1e6e3] py-16 text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid size-12 place-items-center rounded-full border border-[#ced8d2] bg-white text-[#286b59]"><FolderOpen aria-hidden className="size-5" /></div>
              <p className="mt-4 font-semibold">Начните с первого проекта</p>
              <p className="mt-2 text-sm leading-6 text-[#71817a]">Укажите название и период — стандартные колонки для задач появятся автоматически.</p>
              <button className="mt-5 h-11 rounded-md border border-[#b9c9c1] bg-white px-4 text-sm font-semibold text-[#286b59] hover:border-[#286b59]" onClick={openCreate} type="button">Создать проект</button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#dce3df] border-b border-[#dce3df]">
            {projects.data.map((project) => (
              <article className="group grid gap-4 bg-white/45 px-0 py-5 transition-colors hover:bg-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4" key={project.id}>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[#1c2a25]">{project.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#66756e]">
                    <span className="flex items-center gap-2"><CalendarRange aria-hidden className="size-4 text-[#87958f]" />{formatDate(project.startDate)} — {formatDate(project.endDate)}</span>
                    <span>Обновлён {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:justify-end">
                  <button
                    className="mr-1 flex h-11 items-center gap-2 rounded-md border border-[#cbd5d0] bg-white px-3 text-sm font-semibold text-[#286b59] hover:border-[#9eb5aa] hover:bg-[#f7faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59]"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    type="button"
                  >
                    Открыть
                    <ArrowRight aria-hidden className="size-4" />
                  </button>
                  <button aria-label={`Редактировать ${project.name}`} className="grid size-11 place-items-center rounded-md text-[#5c6c65] hover:bg-[#eaf0ed] hover:text-[#286b59] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59]" onClick={() => openEdit(project)} title="Редактировать" type="button"><Pencil aria-hidden className="size-4" /></button>
                  <button aria-label={`Удалить ${project.name}`} className="grid size-11 place-items-center rounded-md text-[#76837d] hover:bg-[#fff0ed] hover:text-[#a3382a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3382a]" onClick={() => openDelete(project)} title="Удалить" type="button"><Trash2 aria-hidden className="size-4" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isCreateOpen ? <ProjectDialog isPending={createMutation.isPending} onClose={() => setIsCreateOpen(false)} onSubmit={(input) => createMutation.mutate(input)} serverError={createMutation.isError ? mutationMessage(createMutation.error) : undefined} /> : null}
      {editingProject ? <ProjectDialog isPending={updateMutation.isPending} onClose={() => setEditingProject(null)} onSubmit={(input) => updateMutation.mutate({ id: editingProject.id, input })} project={editingProject} serverError={updateMutation.isError ? mutationMessage(updateMutation.error) : undefined} /> : null}
      {deletingProject ? <DeleteProjectDialog isPending={deleteMutation.isPending} onClose={() => setDeletingProject(null)} onConfirm={() => deleteMutation.mutate(deletingProject.id)} project={deletingProject} serverError={deleteMutation.isError ? mutationMessage(deleteMutation.error) : undefined} /> : null}
    </main>
  );
}
