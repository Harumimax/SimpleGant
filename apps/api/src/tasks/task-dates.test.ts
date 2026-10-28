import { describe, expect, it } from 'vitest';

import {
  calculateDuration,
  normalizeCreationDates,
  parseDateOnly,
} from './task-dates.js';

describe('task dates', () => {
  it('creates a seven-working-day range when weekends are excluded', () => {
    const dates = normalizeCreationDates(
      '2026-11-02',
      undefined,
      true,
      7,
    );

    expect(dates.startDate).toEqual(parseDateOnly('2026-11-02'));
    expect(dates.endDate).toEqual(parseDateOnly('2026-11-10'));
  });

  it('creates an inclusive seven-calendar-day range when weekends are included', () => {
    const dates = normalizeCreationDates(
      '2026-11-02',
      undefined,
      false,
      7,
    );

    expect(dates.startDate).toEqual(parseDateOnly('2026-11-02'));
    expect(dates.endDate).toEqual(parseDateOnly('2026-11-08'));
  });

  it('calculates a seven-working-day range backwards from the end date', () => {
    const dates = normalizeCreationDates(
      undefined,
      '2026-11-10',
      true,
      7,
    );

    expect(dates.startDate).toEqual(parseDateOnly('2026-11-02'));
    expect(dates.endDate).toEqual(parseDateOnly('2026-11-10'));
  });

  it('skips project non-working days together with weekends', () => {
    const dates = normalizeCreationDates(
      '2026-11-02',
      undefined,
      true,
      7,
      new Set(['2026-11-04']),
    );

    expect(dates.endDate).toEqual(parseDateOnly('2026-11-11'));
  });

  it('preserves two explicit boundaries regardless of duration and weekend setting', () => {
    const dates = normalizeCreationDates(
      '2026-11-02',
      '2026-11-08',
      true,
      7,
    );

    expect(dates.startDate).toEqual(parseDateOnly('2026-11-02'));
    expect(dates.endDate).toEqual(parseDateOnly('2026-11-08'));
  });

  it('derives inclusive duration from task boundaries', () => {
    expect(calculateDuration(
      parseDateOnly('2026-11-02'),
      parseDateOnly('2026-11-08'),
    )).toBe(7);
  });
});
