import type { RetryConfig } from '@/core/resilience/retry-delay';

/**
 * Configuration options for {@link SynqedClient}.
 */
export interface SynqedClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  debug?: boolean;
  retries?: RetryConfig | false;
}

export type { RetryConfig };
