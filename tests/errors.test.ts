import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import { AuthenticationError } from '@/core/errors/authentication-error';
import { NetworkError } from '@/core/errors/network-error';
import { RateLimitError } from '@/core/errors/rate-limit-error';
import { SynqedAPIError } from '@/core/errors/api-error';
import { jsonResponse, stubFetch } from './helpers/mock-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('errors', () => {
  it('maps 401 to AuthenticationError', async () => {
    stubFetch(() =>
      jsonResponse(
        { error: { code: 'unauthorized', message: 'Invalid API key' } },
        { status: 401 },
      ),
    );

    const client = new SynqedClient({ retries: false });

    await expect(client.mcpServers.list()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('maps 429 to RateLimitError', async () => {
    stubFetch(() =>
      jsonResponse(
        { error: { code: 'rate_limited', message: 'Too many requests' } },
        { status: 429 },
      ),
    );

    const client = new SynqedClient({ retries: false });

    await expect(client.mcpServers.list()).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it('maps network failure to NetworkError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );

    const client = new SynqedClient({ retries: false });

    await expect(client.mcpServers.list()).rejects.toBeInstanceOf(NetworkError);
  });

  it('SynqedAPIError exposes code, details, and requestId', async () => {
    stubFetch(() =>
      jsonResponse(
        {
          error: {
            code: 'validation_failed',
            message: 'Request validation failed',
            details: [{ field: 'name', reason: 'required' }],
          },
        },
        { status: 400, headers: { 'X-Request-ID': 'req_123' } },
      ),
    );

    const client = new SynqedClient({ retries: false });

    try {
      await client.mcpServers.list();
      expect.fail('Expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(SynqedAPIError);
      if (error instanceof SynqedAPIError) {
        expect(error.code).toBe('validation_failed');
        expect(error.details).toEqual([{ field: 'name', reason: 'required' }]);
        expect(error.requestId).toBe('req_123');
      }
    }
  });
});
