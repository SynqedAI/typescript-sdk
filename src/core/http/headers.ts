import { createUserAgent } from '../runtime/user-agent';

/**
 * @internal
 */
export function buildHeaders(
  apiKey?: string,
  idempotencyKey?: string,
): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'User-Agent': createUserAgent(),
    ...(apiKey && {
      Authorization: `Bearer ${apiKey}`,
    }),
    ...(idempotencyKey && {
      'Idempotency-Key': idempotencyKey,
    }),
  };
}