//Why?

// Useful during:

// SDK development
// debugging
// support


import type { Middleware } from './types';

export function createDebugMiddleware(): Middleware {
  return {
    onRequest(context) {
      console.log(
        '[Request]',
        context.url,
      );
    },

    onResponse(response) {
      console.log(
        '[Response]',
        response.status,
      );
    },

    onError(error) {
      console.error(
        '[Error]',
        error,
      );
    },
  };
}