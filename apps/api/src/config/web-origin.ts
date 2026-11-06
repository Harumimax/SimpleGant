const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';
const WEB_ORIGIN_PLACEHOLDER = /(?:YOUR[_-]?VPS|IP[_-]?ВАШЕГО[_-]?VPS)/iu;

export function getWebOrigin(value = process.env.WEB_ORIGIN): string {
  const candidate = value ?? DEFAULT_WEB_ORIGIN;

  if (candidate.length === 0 || candidate !== candidate.trim()) {
    throw new Error('WEB_ORIGIN must be a non-empty URL without surrounding spaces.');
  }

  if (WEB_ORIGIN_PLACEHOLDER.test(candidate)) {
    throw new Error(
      'WEB_ORIGIN still contains a placeholder. Set it to the public web origin.',
    );
  }

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error('WEB_ORIGIN must be a valid absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('WEB_ORIGIN must use the http or https protocol.');
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'WEB_ORIGIN must contain only the scheme, hostname, and optional port.',
    );
  }

  return url.origin;
}
