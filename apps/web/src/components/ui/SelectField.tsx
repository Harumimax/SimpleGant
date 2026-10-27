import { useId, type SelectHTMLAttributes } from 'react';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function SelectField({
  label,
  hint,
  error,
  className = '',
  id,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helpId = `${selectId}-help`;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]" htmlFor={selectId}>
        {label}
      </label>
      <select
        aria-describedby={hint || error ? helpId : undefined}
        aria-invalid={Boolean(error)}
        className={`h-12 w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] shadow-[var(--shadow-input)] outline-none transition-[border-color,box-shadow] hover:border-[var(--color-border-hover)] focus:border-[var(--color-primary)] focus:ring-3 focus:ring-[var(--color-primary-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border-strong)]'} ${className}`}
        id={selectId}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-2 text-sm font-medium text-[var(--color-danger)]" id={helpId} role="alert">{error}</p> : hint ? <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]" id={helpId}>{hint}</p> : null}
    </div>
  );
}
