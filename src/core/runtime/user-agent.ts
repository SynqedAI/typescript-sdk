import { VERSION } from '@src/version';

export function createUserAgent(): string {
  return `synqedai-typescript/${VERSION}`;
}