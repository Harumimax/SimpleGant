import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';

import { CsrfOriginGuard } from './csrf-origin.guard.js';

function createContext(method: string, origin?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        headers: { origin },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('CsrfOriginGuard', () => {
  afterEach(() => {
    delete process.env.WEB_ORIGIN;
  });

  it('allows safe requests without an origin', () => {
    const guard = new CsrfOriginGuard();

    expect(guard.canActivate(createContext('GET'))).toBe(true);
  });

  it('allows mutations from the configured frontend origin', () => {
    process.env.WEB_ORIGIN = 'http://localhost:5173';
    const guard = new CsrfOriginGuard();

    expect(
      guard.canActivate(createContext('POST', 'http://localhost:5173')),
    ).toBe(true);
  });

  it('rejects mutations from another origin', () => {
    const guard = new CsrfOriginGuard();

    expect(() =>
      guard.canActivate(createContext('POST', 'https://example.com')),
    ).toThrow(ForbiddenException);
  });
});
