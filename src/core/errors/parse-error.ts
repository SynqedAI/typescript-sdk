import { SynqedAPIError } from '@/core/errors/api-error';
import { AuthenticationError } from '@/core/errors/authentication-error';
import { NetworkError } from '@/core/errors/network-error';
import { RateLimitError } from '@/core/errors/rate-limit-error';
import type { SynqedError } from '@/core/errors/synqed-error';

/** @internal */
export async function parseError(response: Response): Promise<SynqedError> {
  let body: { message?: string; code?: string } | undefined;

  try {
    body = (await response.json()) as { message?: string; code?: string };
  } catch {
    body = undefined;
  }

  const message = body?.message ?? `HTTP ${response.status}`;
  const code = body?.code;
  const requestId = response.headers.get('x-request-id') ?? undefined;

  if (response.status === 401) {
    return new AuthenticationError(message);
  }

  if (response.status === 429) {
    return new RateLimitError(message);
  }

  if (response.status >= 400) {
    return new SynqedAPIError({
      message,
      status: response.status,
      code,
      requestId,
      retryable:
        response.status >= 500 ||
        response.status === 408 ||
        response.status === 409,
    });
  }

  return new NetworkError(message);
}
