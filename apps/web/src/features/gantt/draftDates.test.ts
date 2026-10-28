import { describe, expect, it } from 'vitest';

import { normalizeDraftTaskDates } from './draftDates';

describe('normalizeDraftTaskDates', () => {
  it('skips weekends and project non-working days for a working duration', () => {
    expect(normalizeDraftTaskDates(
      '2026-11-02',
      null,
      7,
      true,
      [{ date: '2026-11-04' } as never],
    )).toEqual({ startDate: '2026-11-02', endDate: '2026-11-11' });
  });

  it('uses calendar days when exclusion is disabled', () => {
    expect(normalizeDraftTaskDates(
      '2026-11-02',
      null,
      7,
      false,
      [{ date: '2026-11-04' } as never],
    )).toEqual({ startDate: '2026-11-02', endDate: '2026-11-08' });
  });

  it('keeps two explicit boundaries unchanged', () => {
    expect(normalizeDraftTaskDates(
      '2026-11-02',
      '2026-11-05',
      20,
      true,
      [],
    )).toEqual({ startDate: '2026-11-02', endDate: '2026-11-05' });
  });
});
