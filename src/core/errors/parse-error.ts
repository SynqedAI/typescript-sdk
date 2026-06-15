import { SynqedAPIError } from '@/core/errors/api-error';
import { AuthenticationError } from '@/core/errors/authentication-error';
import { NetworkError } from '@/core/errors/network-error';
import {
  RateLimitError,
  type RateLimitInfo,
} from '@/core/errors/rate-limit-error';
import type { SynqedError } from '@/core/errors/synqed-error';
import type {
  SynqedErrorCode,
  SynqedErrorDetail,
} from '@/core/errors/synqed-error';

interface ApiErrorBody {
  error?: {
    code?: SynqedErrorCode;
    message?: string;
    details?: SynqedErrorDetail[];
  };
}

/** @internal */
function parseRateLimitHeaders(response: Response): RateLimitInfo {
  const limit = Number(response.headers.get('X-RateLimit-Limit'));
  const remaining = Number(response.headers.get('X-RateLimit-Remaining'));

  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    remaining:
      Number.isFinite(remaining) && remaining >= 0 ? remaining : undefined,
    reset: response.headers.get('X-RateLimit-Reset') ?? undefined,
  };
}

/** @internal */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 409;
}

/** @internal */
export async function parseError(response: Response): Promise<SynqedError> {
  let body: ApiErrorBody | undefined;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = undefined;
  }

  const apiError = body?.error;
  const code = apiError?.code;
  const message = apiError?.message ?? `HTTP ${response.status}`;
  const details = apiError?.details;
  const requestId =
    response.headers.get('X-Request-ID') ??
    response.headers.get('x-request-id') ??
    undefined;

  if (response.status === 401) {
    return new AuthenticationError({ message, code, requestId, details });
  }

  if (response.status === 429) {
    return new RateLimitError({
      message,
      code,
      requestId,
      details,
      rateLimit: parseRateLimitHeaders(response),
    });
  }

  if (response.status >= 400) {
    return new SynqedAPIError({
      message,
      status: response.status,
      code,
      requestId,
      details,
      retryable: isRetryableStatus(response.status),
    });
  }

  return new NetworkError({ message, code, requestId, details });
}
