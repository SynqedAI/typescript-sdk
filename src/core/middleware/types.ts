export interface MiddlewareContext {
  url: string;
  init: RequestInit;
}

/**
 * Internal HTTP hooks around fetch.
 * Not exposed on the public client API.
 *
 * @internal
 */
export interface Middleware {
  onRequest?(context: MiddlewareContext): Promise<void> | void;

  onResponse?(response: Response): Promise<void> | void;

  onError?(error: unknown): Promise<void> | void;
}
