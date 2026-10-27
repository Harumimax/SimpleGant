import { describe, expect, it } from 'vitest';

import {
  calculateDuration,
  normalizeCreationDates,
  parseDateOnly,
} from './task-dates.js';

describe('task dates', () => {
  it('creates an inclusive seven-calendar-day range from an explicit duration', () => {
    const dates = normalizeCreationDates(
      '2026-11-02',
      undefined,
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
