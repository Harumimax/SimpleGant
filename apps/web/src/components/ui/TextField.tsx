import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      icon,
      className = '',
      id,
      type = 'text',
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helpId = `${inputId}-help`;

    return (
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
          htmlFor={inputId}
        >
          {label}
        </label>
        <div className="group relative">
          {icon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-[var(--color-text-faint)] transition-colors duration-150 group-focus-within:text-[var(--color-primary)]">
              {icon}
            </span>
          ) : null}
          <input
            aria-describedby={hint || error ? helpId : undefined}
            aria-invalid={Boolean(error)}
            className={`h-12 w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] shadow-[var(--shadow-input)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[var(--color-text-faint)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-primary)] focus:ring-3 focus:ring-[var(--color-primary-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-faint)] ${icon ? 'pl-11' : ''} ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border-strong)]'} ${className}`}
            data-modal-autofocus={props.autoFocus || undefined}
            id={inputId}
            ref={ref}
            type={type}
            {...props}
          />
        </div>
        {error ? (
          <p
            className="mt-2 text-sm font-medium text-[var(--color-danger)]"
            id={helpId}
            role="alert"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]"
            id={helpId}
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
