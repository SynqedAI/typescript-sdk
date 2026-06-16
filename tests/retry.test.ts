import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import {
  createMcpServer,
  createPaginatedResponse,
  createSession,
  getRequestHeaders,
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
        return jsonResponse(
          { error: { code: 'internal_error', message: 'Server error' } },
          { status: 503 },
        );
      }

      return jsonResponse(createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')]));
    });

    const client = new SynqedClient({
      retries: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    const page = await client.mcpServers.list();
    expect(page.data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry POST without idempotencyKey', async () => {
    const fetchMock = stubFetch((_url, init) => {
      expect(init?.method).toBe('POST');
      return jsonResponse(
        { error: { code: 'internal_error', message: 'Server error' } },
        { status: 503 },
      );
    });

    const client = new SynqedClient({
      retries: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    await expect(
      client.sessions.create({
        user_id: 'user_12345',
        gateway: { exposure_mode: 'dynamic' },
      }),
    ).rejects.toThrow('Server error');

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retries POST with idempotencyKey', async () => {
    let attempts = 0;
    const fetchMock = stubFetch((_url, init) => {
      attempts += 1;
      expect(init?.method).toBe('POST');

      if (attempts < 2) {
        return jsonResponse(
          { error: { code: 'internal_error', message: 'Server error' } },
          { status: 503 },
        );
      }

      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({
      retries: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    const session = await client.sessions.create(
      {
        user_id: 'user_12345',
        gateway: { exposure_mode: 'dynamic' },
      },
      { idempotencyKey: 'session-user-12345' },
    );

    expect(session.id).toBe('sess_123');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry when AbortSignal is triggered', async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = stubFetch(() =>
      jsonResponse(createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')])),
    );

    const client = new SynqedClient({
      retries: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    await expect(
      client.mcpServers.list({}, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe('timeout and abort', () => {
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

describe('SessionsEntity', () => {
  it('create() calls POST /sessions', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/sessions');
      expect(init?.method).toBe('POST');
      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({ retries: false });
    const session = await client.sessions.create({
      user_id: 'user_12345',
      gateway: {
        name: 'My App Gateway',
        exposure_mode: 'dynamic',
        include_all_servers: true,
      },
    });

    expect(session.mcp.url).toBe('https://mcp.synqed.ai/sess_123');
  });

  it('create() sends Idempotency-Key', async () => {
    stubFetch((_url, init) => {
      const headers = getRequestHeaders(init);
      expect(headers.get('Idempotency-Key')).toBe('session-user-12345');
      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({ retries: false });

    await client.sessions.create(
      {
        user_id: 'user_12345',
        gateway: { exposure_mode: 'dynamic' },
      },
      { idempotencyKey: 'session-user-12345' },
    );
  });

  it('create() unwraps ApiResponse.data', async () => {
    stubFetch(() =>
      jsonResponse({
        data: createSession({ id: 'sess_unwrapped', user_id: 'user_999' }),
      }),
    );

    const client = new SynqedClient({ retries: false });
    const session = await client.sessions.create({
      user_id: 'user_999',
      gateway: { exposure_mode: 'dynamic' },
    });

    expect(session.id).toBe('sess_unwrapped');
    expect(session.user_id).toBe('user_999');
  });
});
