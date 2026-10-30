import { describe, expect, it } from 'vitest';

import { isSessionCookieSecure } from './auth.constants.js';

describe('isSessionCookieSecure', () => {
  it('uses an explicit secure-cookie setting', () => {
    expect(isSessionCookieSecure({ COOKIE_SECURE: 'true' })).toBe(true);
    expect(
      isSessionCookieSecure({ COOKIE_SECURE: 'false', NODE_ENV: 'production' }),
    ).toBe(false);
  });

  it('defaults to secure cookies in production', () => {
    expect(isSessionCookieSecure({ NODE_ENV: 'production' })).toBe(true);
    expect(isSessionCookieSecure({ NODE_ENV: 'development' })).toBe(false);
  });
});
