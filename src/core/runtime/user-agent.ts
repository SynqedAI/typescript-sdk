//Professional SDK analytics/debugging.
//Servers can identify SDK usage.

import { VERSION } from '../../version';

export function createUserAgent(): string {
  return `synqedai-typescript/${VERSION}`;
}