// Why Middleware?
// Lets users customize lifecycle:
// logging
// tracing
// analytics
// auth injection
// debugging
// metrics

// WITHOUT changing SDK internals.
// code that runs BEFORE or AFTER requests


export interface MiddlewareContext {
    url: string;
  
    init: RequestInit;
  }
  
  export interface Middleware {
    onRequest?(
      context: MiddlewareContext,
    ): Promise<void> | void;
  
    onResponse?(
      response: Response,
    ): Promise<void> | void;
  
    onError?(
      error: unknown,
    ): Promise<void> | void;
  }