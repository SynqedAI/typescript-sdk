import { CLIENT_NAME, VERSION } from '@/version';

/** @internal */
export function getSdkHeaders(): Record<string, string> {
  return {
    'X-SynqedAI-Client': CLIENT_NAME,
    'X-SynqedAI-Version': VERSION,
  };
}
