import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-16 text-center sm:py-20">
      <div className="grid size-12 place-items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
        {icon}
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-[-0.015em] text-[var(--color-text)] text-balance">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)] text-pretty">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
