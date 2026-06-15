import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import { AuthenticationError } from '@/core/errors/authentication-error';
import { NetworkError } from '@/core/errors/network-error';
import { RateLimitError } from '@/core/errors/rate-limit-error';
import { jsonResponse, stubFetch } from './helpers/mock-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('errors', () => {
  it('maps 401 to AuthenticationError', async () => {
    stubFetch(() =>
      jsonResponse({ message: 'Invalid API key' }, { status: 401 }),
    );

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

    await expect(client.mcpServers.list()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('maps 429 to RateLimitError', async () => {
    stubFetch(() =>
      jsonResponse({ message: 'Too many requests' }, { status: 429 }),
    );

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

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

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

    await expect(client.mcpServers.list()).rejects.toBeInstanceOf(NetworkError);
  });
});
