import { ArrowRight, CalendarDays, LockKeyhole, Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Alert } from '../../components/ui/Alert';
import { Brand } from '../../components/ui/Brand';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ApiError } from '../../lib/api';
import { login, register, type User } from './auth.api';
import { currentUserQueryKey, useCurrentUser } from './auth.queries';

type AuthMode = 'login' | 'register';

const timelineRows = [
  {
    label: 'Исследование',
    offset: '8%',
    width: '34%',
    color: 'var(--color-chart-blue)',
  },
  {
    label: 'Прототип',
    offset: '29%',
    width: '42%',
    color: 'var(--color-chart-green)',
  },
  {
    label: 'Запуск',
    offset: '64%',
    width: '25%',
    color: 'var(--color-chart-sand)',
  },
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
        ? 'Сервис временно недоступен. Проверьте подключение и попробуйте ещё раз.'
        : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    authMutation.mutate();
  }

  return (
    <main
      className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] lg:grid lg:grid-cols-[minmax(420px,43%)_1fr]"
      id="main-content"
    >
      <section className="relative overflow-hidden bg-[var(--color-brand-panel)] px-5 py-5 text-white sm:px-8 sm:py-7 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <div className="relative z-10">
          <Brand inverse linkTo="/" />

          <div className="mt-16 hidden max-w-[560px] lg:block">
            <p className="mb-4 text-sm font-medium text-[var(--color-brand-panel-label)]">
              Планирование без перегрузки
            </p>
            <p className="max-w-lg text-[40px] font-semibold leading-[1.12] tracking-[-0.035em] text-balance xl:text-[44px]">
              Проект целиком — в одной рабочей плоскости
            </p>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--color-brand-panel-muted)] text-pretty">
              Таблица задач и временная шкала остаются рядом, чтобы план было легко читать и менять.
            </p>

            <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-white/12 bg-[var(--color-brand-panel-deep)] shadow-[var(--shadow-auth-preview)]">
              <div className="flex h-11 items-center justify-between border-b border-white/10 px-4 text-xs text-[var(--color-brand-meta)]">
                <span className="flex items-center gap-2">
                  <CalendarDays aria-hidden className="size-4" />
                  Октябрь 2026
                </span>
                <span>План запуска</span>
              </div>
              <div className="auth-timeline-grid p-4">
                {timelineRows.map((row) => (
                  <div
                    className="grid grid-cols-[116px_1fr] items-center"
                    key={row.label}
                  >
                    <span className="pr-4 text-xs text-[var(--color-brand-panel-text)]">
                      {row.label}
                    </span>
                    <div className="relative h-11 border-l border-white/10">
                      <span
                        aria-hidden
                        className="absolute top-3 h-5 rounded-[5px]"
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
        </div>

        <p className="relative z-10 mt-7 hidden text-xs text-[var(--color-brand-panel-subtle)] lg:block">
          Простой Гант для проектов, которым не нужен MS Project.
        </p>

        <div
          aria-hidden
          className="absolute -bottom-28 -right-24 size-80 rounded-full border border-white/[0.06]"
        />
        <div
          aria-hidden
          className="absolute -bottom-12 -right-10 size-48 rounded-full border border-white/[0.06]"
        />
      </section>

      <section className="flex min-h-[calc(100vh-72px)] items-center px-5 py-10 sm:min-h-[calc(100vh-88px)] sm:px-8 lg:min-h-screen lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-balance sm:text-[32px]">
              {isRegister ? 'Создать аккаунт' : 'Войти в SimpleGant'}
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-[var(--color-text-muted)] text-pretty">
              {isRegister
                ? 'Создайте аккаунт, чтобы собрать первый план проекта.'
                : 'Введите данные аккаунта и продолжите работу с проектами.'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextField
              autoComplete="email"
              icon={<Mail aria-hidden className="size-[18px]" />}
              label="Email"
              maxLength={320}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Например, name@example.com…"
              required
              spellCheck={false}
              type="email"
              value={email}
            />

            <TextField
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              hint={
                isRegister
                  ? 'Минимум 10 символов. Используйте пароль, которого нет в других сервисах.'
                  : undefined
              }
              icon={<LockKeyhole aria-hidden className="size-[18px]" />}
              label="Пароль"
              maxLength={72}
              minLength={10}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль…"
              required
              type="password"
              value={password}
            />

            {errorMessage ? <Alert>{errorMessage}</Alert> : null}

            <Button
              className="mt-1 w-full"
              isLoading={authMutation.isPending}
              loadingLabel={isRegister ? 'Создаём аккаунт…' : 'Входим…'}
              type="submit"
            >
              {isRegister ? 'Создать аккаунт' : 'Войти'}
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--color-text-muted)]">
            {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
            <Link
              className="rounded-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2"
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
