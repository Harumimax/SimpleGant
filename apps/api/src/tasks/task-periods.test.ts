import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  calculateTaskPeriodsDuration,
  validateTaskPeriods,
  type TaskWithPeriods,
} from './task-periods.js';

function task(periods: TaskWithPeriods['periods']): TaskWithPeriods {
  return {
    id: '42f87ba8-bf0f-48f5-b27f-dc3e80430f79',
    title: 'Разработка',
    startDate: new Date('2026-11-02T00:00:00.000Z'),
    endDate: new Date('2026-11-06T00:00:00.000Z'),
    includeInDuration: true,
    color: 'sage',
    periods,
  };
}

describe('task periods', () => {
  it('sums only included non-overlapping periods', () => {
    const value = task([
      {
        id: '38491f86-0609-4247-99f4-f08f90e18539',
        title: 'Отпуск',
        startDate: '2026-11-09',
        endDate: '2026-11-13',
        includeInDuration: false,
        color: 'sand',
      },
      {
        id: 'ee697a5f-d488-4c0e-bb34-bc1a86df0f93',
        title: 'Доработка',
        startDate: '2026-11-16',
        endDate: '2026-11-20',
        includeInDuration: true,
        color: 'blue',
      },
    ]);

    expect(validateTaskPeriods(value)).toHaveLength(2);
    expect(calculateTaskPeriodsDuration(value, true, new Set())).toBe(10);
  });

  it('rejects overlapping periods', () => {
    const value = task([{
      id: '38491f86-0609-4247-99f4-f08f90e18539',
      title: 'Пересечение',
      startDate: '2026-11-06',
      endDate: '2026-11-10',
      includeInDuration: true,
      color: 'rose',
    }]);

    expect(() => validateTaskPeriods(value)).toThrow(BadRequestException);
  });
});
