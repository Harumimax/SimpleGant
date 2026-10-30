export const SESSION_COOKIE_NAME = 'simplegant_session';
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_DURATION_SECONDS = SESSION_DURATION_MS / 1000;

export function isSessionCookieSecure(
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (environment.COOKIE_SECURE === 'true') {
    return true;
  }
  if (environment.COOKIE_SECURE === 'false') {
    return false;
  }
  return environment.NODE_ENV === 'production';
}
