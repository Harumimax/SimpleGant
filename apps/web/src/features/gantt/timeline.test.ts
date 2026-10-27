import { describe, expect, it } from 'vitest';

import { buildTimeline, GANTT_DAY_WIDTH } from './timeline';

describe('buildTimeline', () => {
  it('builds an inclusive day range and marks weekends', () => {
    const timeline = buildTimeline('2026-10-30', '2026-11-02');

    expect(timeline.days.map(({ date }) => date)).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(timeline.days.map(({ isWeekend }) => isWeekend)).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(timeline.width).toBe(4 * GANTT_DAY_WIDTH);
  });

  it('groups days by month and ISO week without losing boundary days', () => {
    const timeline = buildTimeline('2026-10-30', '2026-11-03');

    expect(timeline.months.map(({ key, dayCount }) => ({ key, dayCount }))).toEqual([
      { key: '2026-10', dayCount: 2 },
      { key: '2026-11', dayCount: 3 },
    ]);
    expect(timeline.weeks.map(({ dayCount }) => dayCount)).toEqual([3, 2]);
  });
});
