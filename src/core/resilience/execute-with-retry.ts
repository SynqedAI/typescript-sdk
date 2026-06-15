import { sleep } from "./sleep";
import { calculateBackoffDelay, type RetryConfig } from "./retry";

import { addJitter } from "./jitter";
import { shouldRetry } from "./should-retry";

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

export async function executeWithRetry<T>(
  fn: () => Promise<T>,

  options?: {
    method?: string;
    hasIdempotencyKey?: boolean;
  },

  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const retryable = shouldRetry(
        error,

        options?.method,

        options?.hasIdempotencyKey,
      );

      // do not retry unsafe errors
      if (!retryable) {
        throw error;
      }

      // max retries reached
      if (attempt === config.retries) {
        break;
      }

      const delay = addJitter(
        calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs),
      );

      await sleep(delay);
    }
  }

  throw lastError;
}
