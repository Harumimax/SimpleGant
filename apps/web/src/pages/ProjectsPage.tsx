import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChartNoAxesGantt, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { logout } from '../features/auth/auth.api';
import { currentUserQueryKey, useCurrentUser } from '../features/auth/auth.queries';

export function ProjectsPage() {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      navigate('/login', { replace: true });
    },
  });

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#18231f]">
      <header className="border-b border-[#dce2de] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ChartNoAxesGantt aria-hidden className="size-5 text-[#286b59]" />
            SimpleGant
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-56 truncate text-sm text-[#607069] sm:block">
              {currentUser.data?.email}
            </span>
            <button
              aria-label="Выйти"
              className="grid size-11 place-items-center rounded-md text-[#51615a] hover:bg-[#eef2ef] hover:text-[#18231f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] disabled:opacity-50"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              title="Выйти"
              type="button"
            >
              <LogOut aria-hidden className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d4dcd7] pb-5">
          <div>
            <h1 className="text-2xl font-semibold">Проекты</h1>
            <p className="mt-1 text-sm text-[#607069]">
              Ваши рабочие диаграммы Ганта.
            </p>
          </div>
          <button
            className="flex h-11 items-center gap-2 rounded-md bg-[#286b59] px-4 text-sm font-semibold text-white opacity-50"
            disabled
            type="button"
          >
            <Plus aria-hidden className="size-4" />
            Создать проект
          </button>
        </div>

        <div className="grid min-h-72 place-items-center border-b border-[#e1e6e3] py-16 text-center">
          <div>
            <p className="text-sm font-semibold">Проектов пока нет</p>
            <p className="mt-1 text-sm text-[#71817a]">
              Создание проекта появится на следующем шаге.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
