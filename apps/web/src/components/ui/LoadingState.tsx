export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-label="Загрузка" aria-live="polite" className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: rows }, (_, index) => (
        <div className="flex h-[88px] animate-pulse items-center gap-4 px-5" key={index}>
          <div className="size-10 rounded-[var(--radius-control)] bg-[var(--color-skeleton)]" />
          <div className="flex-1">
            <div className="h-3 w-2/5 rounded-full bg-[var(--color-skeleton)]" />
            <div className="mt-3 h-2.5 w-3/5 rounded-full bg-[var(--color-skeleton)]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Загружаем данные…</span>
    </div>
  );
}
