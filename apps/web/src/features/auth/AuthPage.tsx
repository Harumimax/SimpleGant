import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesGantt,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { ApiError } from '../../lib/api';
import { login, register, type User } from './auth.api';
import { currentUserQueryKey, useCurrentUser } from './auth.queries';

type AuthMode = 'login' | 'register';

const timelineRows = [
  { label: 'Исследование', offset: '8%', width: '34%', color: '#9bb7cf' },
  { label: 'Прототип', offset: '29%', width: '42%', color: '#78aa9c' },
  { label: 'Запуск', offset: '64%', width: '25%', color: '#d5a47d' },
];

export function AuthPage({ mode }: { mode: AuthMode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const authMutation = useMutation({
    mutationFn: () =>
      isRegister ? register(email, password) : login(email, password),
    onSuccess: ({ user }) => {
      queryClient.setQueryData<User>(currentUserQueryKey, user);
      navigate('/', { replace: true });
    },
  });

  if (currentUser.data) {
    return <Navigate replace to="/" />;
  }

  const errorMessage =
    authMutation.error instanceof ApiError
      ? authMutation.error.message
      : authMutation.isError
        ? 'Сервис временно недоступен'
        : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    authMutation.mutate();
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#18231f] lg:grid lg:grid-cols-[minmax(360px,44%)_1fr]">
      <section className="relative overflow-hidden bg-[#20362f] px-6 py-7 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <Link
          className="inline-flex items-center gap-2 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          to="/"
        >
          <ChartNoAxesGantt aria-hidden className="size-5 text-[#9ed0be]" />
          SimpleGant
        </Link>

        <div className="mt-14 hidden max-w-xl lg:block">
          <h1 className="max-w-md text-4xl font-semibold leading-tight">
            План проекта перед глазами
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#cfddd7]">
            Рабочая таблица и временная шкала в одном спокойном пространстве.
          </p>

          <div className="mt-10 overflow-hidden rounded-md border border-white/15 bg-[#172a24] shadow-2xl shadow-black/15">
            <div className="flex h-10 items-center border-b border-white/10 px-4 text-xs text-[#b9cbc4]">
              <CalendarDays aria-hidden className="mr-2 size-4" />
              Октябрь 2026
            </div>
            <div className="auth-timeline-grid p-4">
              {timelineRows.map((row) => (
                <div className="grid grid-cols-[116px_1fr] items-center" key={row.label}>
                  <span className="pr-4 text-xs text-[#d8e3de]">{row.label}</span>
                  <div className="relative h-11 border-l border-white/10">
                    <span
                      className="absolute top-3 h-5 rounded-sm"
                      style={{
                        backgroundColor: row.color,
                        left: row.offset,
                        width: row.width,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 hidden text-xs text-[#9fb5ac] lg:block">
          Просто Гант. Без лишней сложности.
        </p>
      </section>

      <section className="flex min-h-[calc(100vh-76px)] items-center px-6 py-10 sm:px-10 lg:min-h-screen lg:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-normal">
              {isRegister ? 'Создать аккаунт' : 'Войти в аккаунт'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#607069]">
              {isRegister
                ? 'Начните с первого проекта и соберите план по шагам.'
                : 'Продолжите работу со своими проектами.'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <span className="relative block">
                <Mail
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#71817a]"
                />
                <input
                  autoComplete="email"
                  autoFocus
                  className="h-12 w-full rounded-md border border-[#c9d1cd] bg-white pl-11 pr-3 text-base outline-none transition focus:border-[#357765] focus:ring-3 focus:ring-[#77aa9a]/20"
                  maxLength={320}
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Пароль</span>
              <span className="relative block">
                <LockKeyhole
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#71817a]"
                />
                <input
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="h-12 w-full rounded-md border border-[#c9d1cd] bg-white pl-11 pr-3 text-base outline-none transition focus:border-[#357765] focus:ring-3 focus:ring-[#77aa9a]/20"
                  maxLength={72}
                  minLength={10}
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Минимум 10 символов"
                  required
                  type="password"
                  value={password}
                />
              </span>
              {isRegister && (
                <span className="mt-2 block text-xs leading-5 text-[#71817a]">
                  Используйте длинную фразу, которую не применяете в других сервисах.
                </span>
              )}
            </label>

            <div aria-live="polite" className="min-h-6">
              {errorMessage && (
                <p className="text-sm font-medium text-[#a23d3d]">{errorMessage}</p>
              )}
            </div>

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#286b59] px-4 text-sm font-semibold text-white transition hover:bg-[#205a4b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] disabled:cursor-wait disabled:opacity-60"
              disabled={authMutation.isPending}
              type="submit"
            >
              {authMutation.isPending
                ? 'Подождите…'
                : isRegister
                  ? 'Создать аккаунт'
                  : 'Войти'}
              {!authMutation.isPending && <ArrowRight aria-hidden className="size-4" />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#607069]">
            {isRegister ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}{' '}
            <Link
              className="font-semibold text-[#286b59] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59]"
              to={isRegister ? '/login' : '/register'}
            >
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
