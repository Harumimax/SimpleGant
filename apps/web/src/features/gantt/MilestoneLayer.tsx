import type { Milestone } from '../milestones/milestones.api';
import { calculateMilestoneLeft } from './timeline';

type Props = {
  milestones: Milestone[];
  timelineStartDate: string;
  timelineEndDate: string;
};

export function MilestoneLayer({
  milestones,
  timelineStartDate,
  timelineEndDate,
}: Props) {
  return (
    <div aria-label="Вехи проекта" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {milestones.map((milestone, index) => {
        const left = calculateMilestoneLeft(
          milestone.date,
          timelineStartDate,
          timelineEndDate,
        );
        if (left === null) return null;
        return (
          <div
            className="gantt-milestone absolute inset-y-0"
            data-color={milestone.color}
            key={milestone.id}
            style={{ left }}
          >
            <div aria-hidden className="gantt-milestone-line absolute inset-y-0 left-0 w-px" />
            <span
              className="gantt-milestone-label absolute left-1 max-w-32 truncate rounded px-1.5 py-0.5 text-[9px] font-semibold shadow-sm"
              style={{ top: 3 + index % 2 * 20 }}
              title={`${milestone.title} — ${milestone.date}`}
            >
              {milestone.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
