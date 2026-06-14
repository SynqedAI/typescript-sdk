// Why Retry Exists

// Networks fail temporarily.

//Automatically retry SAFE failures.


export interface RetryConfig {
    retries: number;
  
    baseDelayMs: number;
  
    maxDelayMs: number;
  }

  export function calculateBackoffDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
  ): number {
    return Math.min(
      baseDelayMs * 2 ** attempt,
      maxDelayMs,
    );
  }