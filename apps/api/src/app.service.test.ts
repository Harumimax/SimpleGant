import { describe, expect, it } from 'vitest';

import { AppService } from './app.service.js';

describe('AppService', () => {
  it('returns the API health status', () => {
    const service = new AppService();

    expect(service.getHealth()).toEqual({
      service: 'simplegant-api',
      status: 'ok',
    });
  });
});
