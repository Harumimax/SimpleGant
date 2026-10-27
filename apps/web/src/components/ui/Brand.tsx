import { ChartNoAxesGantt } from 'lucide-react';
import { Link } from 'react-router-dom';

type BrandProps = {
  inverse?: boolean;
  linkTo?: string;
  compact?: boolean;
};

export function Brand({ inverse = false, linkTo, compact = false }: BrandProps) {
  const content = (
    <>
      <span
        className={`grid size-8 place-items-center rounded-[10px] ${inverse ? 'bg-white/12 text-[var(--color-brand-mark)]' : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'}`}
      >
        <ChartNoAxesGantt aria-hidden className="size-[18px]" />
      </span>
      {!compact ? <span translate="no">SimpleGant</span> : null}
    </>
  );
  const className = `inline-flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] ${inverse ? 'text-white' : 'text-[var(--color-text)]'}`;

  return linkTo ? (
    <Link
      className={`${className} rounded-[var(--radius-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2`}
      to={linkTo}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
