const SENSITIVE_HEADERS = new Set([
  'authorization',
  'x-api-key',
  'cookie',
  'set-cookie',
]);

function redactHeaders(headers?: HeadersInit) {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = SENSITIVE_HEADERS.has(key.toLowerCase())
      ? '[REDACTED]'
      : value;
  });

  return result;
}

/** @internal */
export function logDebugRequest(url: string, init: RequestInit): void {
  console.debug('[SynqedAI SDK Request]', {
    url,
    method: init.method,
    headers: redactHeaders(init.headers),
    body: init.body,
  });
}

/** @internal */
export function logDebugResponse(response: Response): void {
  console.debug('[SynqedAI SDK Response]', {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    headers: redactHeaders(response.headers),
  });
}

/** @internal */
export function logDebugError(error: unknown): void {
  console.error('[SynqedAI SDK Error]', error);
}
