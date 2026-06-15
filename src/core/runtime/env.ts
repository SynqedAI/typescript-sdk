/** @internal */
export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }

  return undefined;
}

/** @internal */
export const ENV_API_KEY = 'SYNQEDAI_API_KEY';

/** @internal */
export const ENV_BASE_URL = 'SYNQEDAI_BASE_URL';

/** @internal */
export const DEFAULT_BASE_URL = 'https://api.synqed.ai';

/** @internal */
export const DEFAULT_TIMEOUT_MS = 30_000;
