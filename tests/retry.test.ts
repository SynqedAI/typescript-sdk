import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import {
  createMcpServer,
  createPaginatedResponse,
  jsonResponse,
  stubFetch,
} from './helpers/mock-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('retry', () => {
  it('retries 5xx responses for GET requests', async () => {
    let attempts = 0;
    const fetchMock = stubFetch(() => {
      attempts += 1;

      if (attempts < 3) {
        return jsonResponse({ message: 'Server error' }, { status: 503 });
      }

      return jsonResponse(createPaginatedResponse([createMcpServer('1', 'A')]));
    });

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    const page = await client.mcpServers.list();
    expect(page.data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry unsafe POST without idempotency key', async () => {
    const fetchMock = stubFetch((_url, init) => {
      expect(init?.method).toBe('POST');
      return jsonResponse({ message: 'Server error' }, { status: 503 });
    });

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    await expect(
      client.mcpServers.create({ name: 'Test', transport: 'stdio' }),
    ).rejects.toThrow('Server error');

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe('timeout and abort', () => {
  it('aborts when AbortSignal is triggered', async () => {
    const controller = new AbortController();
    controller.abort();

    stubFetch(() => jsonResponse({ data: [] }));

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

    await expect(
      client.mcpServers.list({}, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('times out long-running requests', async () => {
    vi.useFakeTimers();

    stubFetch((_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason);
        });
      }),
    );

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      timeoutMs: 50,
      retries: false,
    });

    const promise = client.mcpServers.list({}, { timeoutMs: 50 });
    const assertion = expect(promise).rejects.toMatchObject({
      name: 'TimeoutError',
    });

    await vi.advanceTimersByTimeAsync(60);
    await assertion;
  });
});
