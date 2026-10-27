import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-3.5 py-3 text-sm font-medium text-[var(--color-danger)]"
      role="alert"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
