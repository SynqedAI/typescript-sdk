import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import {
  createSession,
  getRequestHeaders,
  jsonResponse,
  stubFetch,
} from './helpers/mock-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SessionsEntity', () => {
  it('create() calls POST /sessions with inline gateway', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/sessions');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          user_id: 'usr_acme_sales_42',
          gateway: {
            name: 'CRM Gateway',
            exposure_mode: 'dynamic',
            include_all_servers: true,
          },
        }),
      );
      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({ retries: false });
    const session = await client.sessions.create({
      user_id: 'usr_acme_sales_42',
      gateway: {
        name: 'CRM Gateway',
        exposure_mode: 'dynamic',
        include_all_servers: true,
      },
    });

    expect(session.mcp.url).toContain('acme-corp-sales-team');
    expect(session.connections[0]?.server_slug).toBe('hubspot');
  });

  it('create() accepts gateway_id instead of inline gateway', async () => {
    stubFetch((_url, init) => {
      expect(init?.body).toBe(
        JSON.stringify({
          user_id: 'usr_acme_sales_42',
          gateway_id: 'gw_crm2x8fp',
        }),
      );
      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({ retries: false });
    await client.sessions.create({
      user_id: 'usr_acme_sales_42',
      gateway_id: 'gw_crm2x8fp',
    });
  });

  it('create() sends Idempotency-Key when provided', async () => {
    stubFetch((_url, init) => {
      const headers = getRequestHeaders(init);
      expect(headers.get('Idempotency-Key')).toBe('session-user-12345');
      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({ retries: false });

    await client.sessions.create(
      {
        user_id: 'usr_acme_sales_42',
        gateway: { name: 'CRM Gateway', exposure_mode: 'dynamic' },
      },
      { idempotencyKey: 'session-user-12345' },
    );
  });

  it('create() unwraps ApiResponse.data', async () => {
    stubFetch(() =>
      jsonResponse({
        data: createSession({ id: 'inst_unwrapped', user_id: 'user_999' }),
      }),
    );

    const client = new SynqedClient({ retries: false });
    const session = await client.sessions.create({
      user_id: 'user_999',
      gateway: { name: 'CRM Gateway' },
    });

    expect(session.id).toBe('inst_unwrapped');
    expect(session.user_id).toBe('user_999');
  });

  it('getById() calls GET /sessions/:id and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/sessions/inst_acme42x');
      expect(init?.method).toBe('GET');
      return jsonResponse({ data: createSession() });
    });

    const client = new SynqedClient({ retries: false });
    const session = await client.sessions.getById('inst_acme42x');

    expect(session.id).toBe('inst_acme42x');
    expect(session.gateway_id).toBe('gw_crm2x8fp');
    expect(session.mcp.url).toContain('mcp-proxy-api');
  });
});
