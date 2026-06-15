import type { Middleware } from "./types";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "x-api-key",
  "cookie",
  "set-cookie",
]);

function redactHeaders(headers?: HeadersInit) {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = SENSITIVE_HEADERS.has(key.toLowerCase())
      ? "[REDACTED]"
      : value;
  });

  return result;
}

/**
 * Logs requests, successful responses, and errors when debug mode is enabled.
 *
 * @internal
 */
export function createDebugMiddleware(): Middleware {
  return {
    async onRequest(context) {
      console.debug("[SynqedAI SDK Request]", {
        url: context.url,
        method: context.init.method,
        headers: redactHeaders(context.init.headers),
        body: context.init.body,
      });
    },

    async onResponse(response) {
      console.debug("[SynqedAI SDK Response]", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: redactHeaders(response.headers),
      });
    },

    async onError(error) {
      console.error("[SynqedAI SDK Error]", error);
    },
  };
}
