import { SynqedError } from '@/core/errors/synqed-error';

const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** @internal */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** @internal */
function isRetryableMethod(
  method: string,
  hasIdempotencyKey: boolean,
): boolean {
  const normalizedMethod = method.toUpperCase();

  if (SAFE_HTTP_METHODS.has(normalizedMethod)) {
    return true;
  }

  return hasIdempotencyKey;
}

/** @internal */
export function shouldRetry(
  error: unknown,
  method = 'GET',
  hasIdempotencyKey = false,
): boolean {
  if (isAbortError(error)) {
    return false;
  }

  if (error instanceof SynqedError) {
    if (!error.retryable) {
      return false;
    }

    if (error.status && !RETRYABLE_STATUS_CODES.has(error.status)) {
      return false;
    }

    return isRetryableMethod(method, hasIdempotencyKey);
  }

  if (error instanceof TypeError) {
    return isRetryableMethod(method, hasIdempotencyKey);
  }

  return false;
}
