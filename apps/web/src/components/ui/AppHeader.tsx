import { LogOut } from 'lucide-react';

import { Brand } from './Brand';
import { Button } from './Button';

type AppHeaderProps = {
  email?: string;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export function AppHeader({ email, isLoggingOut, onLogout }: AppHeaderProps) {
  const initial = email?.charAt(0).toUpperCase() ?? 'П';

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-16 max-w-[var(--container-app)] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)]">
              {initial}
            </span>
            <span className="max-w-52 truncate text-sm text-[var(--color-text-muted)]">
              {email}
            </span>
          </div>
          <span aria-hidden className="hidden h-6 w-px bg-[var(--color-border)] sm:block" />
          <Button
            aria-label="Выйти"
            isLoading={isLoggingOut}
            loadingLabel="Выходим…"
            onClick={onLogout}
            size="icon"
            title="Выйти"
            type="button"
            variant="ghost"
          >
            <LogOut aria-hidden className="size-[18px]" />
          </Button>
        </div>
      </div>
    </header>
  );
}
