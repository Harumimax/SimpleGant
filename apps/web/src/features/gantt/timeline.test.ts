import { describe, expect, it } from 'vitest';

import {
  buildTimeline,
  calculateTaskDateChange,
  calculateTaskBarGeometry,
  calculateTaskDuration,
  calculateMilestoneLeft,
  GANTT_DAY_WIDTH,
  GANTT_SCALE_DAY_WIDTH,
} from './timeline';

describe('calculateTaskDuration', () => {
  it('calculates inclusive task duration from resized boundaries', () => {
    expect(calculateTaskDuration('2026-11-02', '2026-11-08')).toBe(7);
    expect(calculateTaskDuration('2026-11-02', '2026-11-02')).toBe(1);
  });

  it('calculates duration using the project working calendar', () => {
    expect(calculateTaskDuration(
      '2026-11-02',
      '2026-11-08',
      true,
      [{ date: '2026-11-04' }],
    )).toBe(4);
    expect(calculateTaskDuration('2026-11-07', '2026-11-08', true)).toBe(0);
  });
});

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

  it('builds compact week and month scales from the same daily date model', () => {
    const weeks = buildTimeline('2026-12-28', '2027-01-10', 'weeks');
    const months = buildTimeline('2026-12-28', '2027-01-10', 'months');

    expect(weeks.scale).toBe('weeks');
    expect(weeks.dayWidth).toBe(GANTT_SCALE_DAY_WIDTH.weeks);
    expect(weeks.width).toBe(14 * GANTT_SCALE_DAY_WIDTH.weeks);
    expect(months.scale).toBe('months');
    expect(months.dayWidth).toBe(GANTT_SCALE_DAY_WIDTH.months);
    expect(months.width).toBe(14 * GANTT_SCALE_DAY_WIDTH.months);
    expect(months.years.map(({ key, dayCount }) => ({ key, dayCount }))).toEqual([
      { key: '2026', dayCount: 4 },
      { key: '2027', dayCount: 10 },
    ]);
  });
});

describe('calculateMilestoneLeft', () => {
  it('centers a milestone line in its day cell', () => {
    expect(
      calculateMilestoneLeft('2026-11-03', '2026-11-01', '2026-11-30'),
    ).toBe(2 * GANTT_DAY_WIDTH + GANTT_DAY_WIDTH / 2);
  });

  it('centers a milestone using the selected scale width', () => {
    expect(
      calculateMilestoneLeft(
        '2026-11-03',
        '2026-11-01',
        '2026-11-30',
        GANTT_SCALE_DAY_WIDTH.months,
      ),
    ).toBe(2 * GANTT_SCALE_DAY_WIDTH.months + GANTT_SCALE_DAY_WIDTH.months / 2);
  });

  it('does not render a milestone outside the project period', () => {
    expect(
      calculateMilestoneLeft('2026-12-01', '2026-11-01', '2026-11-30'),
    ).toBeNull();
  });
});

describe('calculateTaskDateChange', () => {
  it('moves both dates by calendar days without skipping a weekend', () => {
    expect(
      calculateTaskDateChange(
        '2026-11-06',
        '2026-11-09',
        1,
        'move',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({ startDate: '2026-11-07', endDate: '2026-11-10' });
  });

  it('keeps a moved task inside the project period', () => {
    expect(
      calculateTaskDateChange(
        '2026-11-03',
        '2026-11-05',
        -10,
        'move',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({ startDate: '2026-11-01', endDate: '2026-11-03' });
  });

  it('resizes either boundary and preserves at least one day', () => {
    expect(
      calculateTaskDateChange(
        '2026-11-03',
        '2026-11-05',
        1,
        'resize-start',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({ startDate: '2026-11-04', endDate: '2026-11-05' });
    expect(
      calculateTaskDateChange(
        '2026-11-03',
        '2026-11-05',
        -20,
        'resize-end',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({ startDate: '2026-11-03', endDate: '2026-11-03' });
  });

  it('keeps resized boundaries inside the project period', () => {
    expect(
      calculateTaskDateChange(
        '2026-11-03',
        '2026-11-05',
        50,
        'resize-end',
        '2026-11-01',
        '2026-11-30',
      ),
    ).toEqual({ startDate: '2026-11-03', endDate: '2026-11-30' });
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

  it('uses the selected scale width for task geometry', () => {
    expect(
      calculateTaskBarGeometry(
        '2026-11-03',
        '2026-11-05',
        '2026-11-01',
        '2026-11-30',
        GANTT_SCALE_DAY_WIDTH.weeks,
      ),
    ).toEqual(expect.objectContaining({
      left: 2 * GANTT_SCALE_DAY_WIDTH.weeks,
      width: 3 * GANTT_SCALE_DAY_WIDTH.weeks,
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
