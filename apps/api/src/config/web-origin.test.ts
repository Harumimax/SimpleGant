import { describe, expect, it } from 'vitest';

import { getWebOrigin } from './web-origin.js';

describe('getWebOrigin', () => {
  it('uses the local frontend origin by default', () => {
    expect(getWebOrigin(undefined)).toBe('http://localhost:5173');
  });

  it('normalizes a valid public origin', () => {
    expect(getWebOrigin('https://example.com:8443/')).toBe(
      'https://example.com:8443',
    );
  });

  it('rejects a deployment placeholder', () => {
    expect(() => getWebOrigin('http://IP_ВАШЕГО_VPS:8080')).toThrow(
      'WEB_ORIGIN still contains a placeholder',
    );
  });

  it.each([
    '',
    ' https://example.com',
    'example.com',
    'ftp://example.com',
    'https://user:password@example.com',
    'https://example.com/api',
    'https://example.com?source=test',
  ])('rejects invalid origin %j', (origin) => {
    expect(() => getWebOrigin(origin)).toThrow();
  });
});
