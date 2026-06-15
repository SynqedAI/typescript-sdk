import {
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from '@/core/resilience/retry-delay';
import { shouldRetry } from '@/core/resilience/should-retry';
import { sleep } from '@/core/resilience/sleep';

/** @internal */
export async function executeWithRetry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: {
    method?: string;
    hasIdempotencyKey?: boolean;
    signal?: AbortSignal;
    retries?: RetryConfig | false;
  },
): Promise<T> {
  if (options.retries === false) {
    return fn(options.signal);
  }

  const config: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...options.retries,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn(options.signal);
    } catch (error) {
      lastError = error;

      const retryable = shouldRetry(
        error,
        options.method,
        options.hasIdempotencyKey,
      );

      if (!retryable || attempt === config.maxAttempts) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt, config);
      await sleep(delay, options.signal);
    }
  }

  throw lastError;
}
