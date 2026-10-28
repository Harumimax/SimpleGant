import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Milestone } from '../milestones/milestones.api';
import { GANTT_DAY_WIDTH } from './timeline';
import { MilestoneLayer } from './MilestoneLayer';

const milestone: Milestone = {
  id: 'milestone-1',
  projectId: 'project-1',
  title: 'Релиз',
  date: '2026-11-03',
  color: 'coral',
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
};

describe('MilestoneLayer', () => {
  it('renders a named vertical marker at the date center', () => {
    render(
      <MilestoneLayer
        milestones={[milestone]}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    const label = screen.getByText('Релиз');
    expect(label.parentElement).toHaveStyle({
      left: `${2 * GANTT_DAY_WIDTH + GANTT_DAY_WIDTH / 2}px`,
    });
    expect(label.parentElement).toHaveAttribute('data-color', 'coral');
  });

  it('positions the marker with the selected scale width', () => {
    render(
      <MilestoneLayer
        dayWidth={6}
        milestones={[milestone]}
        timelineEndDate="2026-11-30"
        timelineStartDate="2026-11-01"
      />,
    );

    expect(screen.getByText('Релиз').parentElement).toHaveStyle({ left: '15px' });
  });
});
