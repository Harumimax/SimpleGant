import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import {
  buttonClassName,
  type ButtonSize,
  type ButtonVariant,
} from './button.styles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingLabel = 'Подождите…',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={isLoading || undefined}
      className={buttonClassName({ variant, size, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          {size === 'icon' ? <span className="sr-only">{loadingLabel}</span> : loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
