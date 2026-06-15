import type { Middleware, MiddlewareContext } from './types';

/**
 * @internal
 */
export async function runOnRequest(
  middlewares: Middleware[],
  context: MiddlewareContext,
): Promise<void> {
  for (const middleware of middlewares) {
    await middleware.onRequest?.(context);
  }
}

/**
 * @internal
 */
export async function runOnResponse(
  middlewares: Middleware[],
  response: Response,
): Promise<void> {
  for (const middleware of middlewares) {
    await middleware.onResponse?.(response);
  }
}

/**
 * @internal
 */
export async function runOnError(
  middlewares: Middleware[],
  error: unknown,
): Promise<void> {
  for (const middleware of middlewares) {
    await middleware.onError?.(error);
  }
}
