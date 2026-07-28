function normalizeApiUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname === '127.0.0.1' ? 'localhost' : url.hostname;
    const port = url.port || '8000';
    const pathname = url.pathname.replace(/\/$/, '');
    return `${url.protocol}//${hostname}${port ? `:${port}` : ''}${pathname}`;
  } catch {
    return rawUrl;
  }
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
  }

  return 'http://localhost:8000';
}

export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}
