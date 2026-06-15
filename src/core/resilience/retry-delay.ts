export interface RetryConfig {
  /** Maximum number of retry attempts after the initial request. */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff. */
  baseDelayMs?: number;
  /** Maximum delay cap in milliseconds. */
  maxDelayMs?: number;
}

/** @internal */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5_000,
};

/** @internal */
export function calculateRetryDelay(
  attempt: number,
  config: Required<RetryConfig>,
): number {
  const exponential = Math.min(
    config.baseDelayMs * 2 ** attempt,
    config.maxDelayMs,
  );

  return Math.random() * exponential;
}
