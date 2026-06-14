import type { Middleware } from '../core/middleware/types';

export interface SynqedAIClientConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  debug?: boolean;
  dryRun?: boolean;
  middleware?: Middleware[];
}