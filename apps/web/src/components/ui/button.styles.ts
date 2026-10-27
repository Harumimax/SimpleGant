export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'icon';

const baseClassName =
  'inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55';

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-button)] hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
  danger:
    'border border-[var(--color-danger)] bg-[var(--color-danger)] text-white shadow-[var(--shadow-button)] hover:border-[var(--color-danger-hover)] hover:bg-[var(--color-danger-hover)]',
};

const sizeClassNames: Record<ButtonSize, string> = {
  md: 'h-11 rounded-[var(--radius-control)] px-4 text-sm',
  icon: 'size-11 rounded-[var(--radius-control)]',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `${baseClassName} ${variantClassNames[variant]} ${sizeClassNames[size]} ${className}`.trim();
}
