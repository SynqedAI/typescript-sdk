import { APIError } from './APIError';
import { NetworkError } from './NetworkError';
import { AuthenticationError }
  from './AuthenticationError';
import { RateLimitError }
  from './RateLimitError';

export async function parseError(
  response: Response,
): Promise<Error> {
  let body: any;

  try {
    body =
      await response.json();
  } catch {
    body = undefined;
  }

  const message =
    body?.message ??
    `HTTP ${response.status}`;

  const code = body?.code;

  const requestId =
    response.headers.get(
      'x-request-id',
    ) ?? undefined;

  if (response.status === 401) {
    return new AuthenticationError(
      message,
    );
  }

  if (response.status === 429) {
    return new RateLimitError(
      message,
    );
  }

  if (response.status >= 400) {
    return new APIError({
      message,
      status: response.status,
      code,
      requestId,
      retryable:
        response.status >= 500,
    });
  }
  return new NetworkError(message);
}