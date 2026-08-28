import { environment } from 'src/environments/environment';

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;

/**
 * Media URLs from the API often point at http://localhost:2222 (or :44374).
 * Rewrite those hosts to environment.baseUrl (dev tunnel / API) so images load in the browser.
 */
export function rewriteMediaUrl(url: string | null | undefined): string {
  if (url == null) {
    return '';
  }

  let value = String(url).trim().replace(/\\/g, '/');
  if (!value) {
    return '';
  }

  if (
    value.startsWith('assets/') ||
    value.startsWith('/assets/') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value.replace(/^\//, '');
  }

  const base = (environment.baseUrl || '').replace(/\/$/, '');

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (LOCAL_HOST.test(parsed.hostname) && base) {
        const api = new URL(base.includes('://') ? base : `https://${base}`);
        return `${api.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return value;
    }
    return value;
  }

  if (!base) {
    return value.startsWith('/') ? value : `/${value}`;
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  return `${base}${path}`;
}
