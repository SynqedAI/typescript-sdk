import { BaseError } from '../errors/BaseError';

const RETRYABLE_STATUS_CODES = [
  408, // timeout
  429, // rate limit
  500,
  502,
  503,
  504,
];

const SAFE_HTTP_METHODS = [
  'GET',
  'HEAD',
  'OPTIONS',
];

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError'
  );
}

function isRetryableMethod(
  method: string,
  hasIdempotencyKey: boolean,
): boolean {
  const normalizedMethod =
    method.toUpperCase();

  if (
    SAFE_HTTP_METHODS.includes(
      normalizedMethod,
    )
  ) {
    return true;
  }

  return hasIdempotencyKey;
}

export function shouldRetry(
  error: unknown,
  method = 'GET',
  hasIdempotencyKey = false,
): boolean {
  if (isAbortError(error)) {
    return false;
  }

  if (error instanceof BaseError) {
    if (!error.retryable) {
      return false;
    }

    if (
      error.status &&
      !RETRYABLE_STATUS_CODES.includes(
        error.status,
      )
    ) {
      return false;
    }

    return isRetryableMethod(
      method,
      hasIdempotencyKey,
    );
  }

  // fetch network failures usually throw TypeError
  if (error instanceof TypeError) {
    return isRetryableMethod(
      method,
      hasIdempotencyKey,
    );
  }

  return false;
}