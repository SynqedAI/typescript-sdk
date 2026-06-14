// Runtime-Safe Env Access
// SDK must support: (Node, Bun, Deno, browser)
//Direct: (process.env) breaks in browser builds

export function getEnv(
    key: string,
  ): string | undefined {
    if (
      typeof process !== 'undefined' &&
      process.env
    ) {
      return process.env[key];
    }
  
    return undefined;
  }