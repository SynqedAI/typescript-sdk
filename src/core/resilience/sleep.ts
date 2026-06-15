/** @internal */
export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('Aborted', 'AbortError');
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
