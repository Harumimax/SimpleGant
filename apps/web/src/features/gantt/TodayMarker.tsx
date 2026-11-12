import { format } from 'date-fns';

import {
  calculateMilestoneLeft,
  GANTT_DAY_WIDTH,
  GANTT_HEADER_HEIGHT,
} from './timeline';

type Props = {
  timelineStartDate: string;
  timelineEndDate: string;
  todayDate: string;
  dayWidth?: number;
};

export function currentDateIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function TodayMarker({
  timelineStartDate,
  timelineEndDate,
  todayDate,
  dayWidth = GANTT_DAY_WIDTH,
}: Props) {
  const left = calculateMilestoneLeft(
    todayDate,
    timelineStartDate,
    timelineEndDate,
    dayWidth,
  );

  if (left === null) return null;

  return (
    <div
      aria-label={`Сегодня — ${todayDate}`}
      className="pointer-events-none absolute inset-0"
    >
      <div
        aria-hidden
        className="absolute bottom-0 z-[1] w-px bg-[var(--color-today)]"
        style={{ left, top: GANTT_HEADER_HEIGHT }}
      />
      <span
        className="absolute top-1 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--color-today)] bg-[var(--color-today-soft)] px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[var(--color-today-text)] shadow-sm"
        style={{ left }}
      >
        Сегодня
      </span>
    </div>
  );
}
