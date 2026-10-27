import { describe, expect, it } from 'vitest';

import {
  buildTimeline,
  calculateTaskBarGeometry,
  GANTT_DAY_WIDTH,
} from './timeline';

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

describe('calculateTaskBarGeometry', () => {
  it('renders a one-day task as one full day cell', () => {
    expect(
      calculateTaskBarGeometry(
        '2026-11-03',
        '2026-11-03',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({
      left: 2 * GANTT_DAY_WIDTH,
      width: GANTT_DAY_WIDTH,
      isClippedStart: false,
      isClippedEnd: false,
    });
  });

  it('counts both task boundary days across a month boundary', () => {
    expect(
      calculateTaskBarGeometry(
        '2026-10-31',
        '2026-11-02',
        '2026-10-30',
        '2026-11-10',
      ),
    ).toEqual(expect.objectContaining({
      left: GANTT_DAY_WIDTH,
      width: 3 * GANTT_DAY_WIDTH,
    }));
  });

  it('clips a partially visible task to project boundaries', () => {
    expect(
      calculateTaskBarGeometry(
        '2026-10-20',
        '2026-11-03',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({
      left: 0,
      width: 3 * GANTT_DAY_WIDTH,
      isClippedStart: true,
      isClippedEnd: false,
    });
  });

  it('does not render missing, invalid or fully out-of-range dates', () => {
    expect(
      calculateTaskBarGeometry(null, null, '2026-11-01', '2026-11-30'),
    ).toBeNull();
    expect(
      calculateTaskBarGeometry(
        '2026-11-05',
        '2026-11-01',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toBeNull();
    expect(
      calculateTaskBarGeometry(
        '2026-12-01',
        '2026-12-03',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toBeNull();
  });
});
