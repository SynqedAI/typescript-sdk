import { getSdkHeaders } from '@/core/runtime/user-agent';

/** @internal */
export function buildHeaders(options: {
  apiKey?: string;
  idempotencyKey?: string;
  requestId?: string;
  hasBody: boolean;
}): HeadersInit {
  return {
    ...getSdkHeaders(),
    ...(options.hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.apiKey ? { 'X-API-Key': options.apiKey } : {}),
    ...(options.requestId ? { 'X-Request-ID': options.requestId } : {}),
    ...(options.idempotencyKey
      ? { 'Idempotency-Key': options.idempotencyKey }
      : {}),
  };
}

/** @internal */
export function createTimeoutSignal(
  timeoutMs: number,
  parentSignal?: AbortSignal,
): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeout);
  };

  controller.signal.addEventListener('abort', cleanup, { once: true });

  if (parentSignal) {
    if (parentSignal.aborted) {
      cleanup();
      controller.abort(parentSignal.reason);
      return controller.signal;
    }

    parentSignal.addEventListener(
      'abort',
      () => {
        cleanup();
        controller.abort(parentSignal.reason);
      },
      { once: true },
    );
  }

  return controller.signal;
}
