import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import type { Connection } from '@/entities/connections/types';
import {
  createPaginatedResponse,
  getRequestHeaders,
  jsonResponse,
  stubFetch,
} from './helpers/mock-fetch';

function createConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: 'conn_hb9x2k',
    name: 'HubSpot - Acme Corp',
    connection_status: 'initiated',
    server_name: 'HubSpot',
    server_slug: 'hubspot',
    redirect_url:
      'https://mcp.synqed.ai/api/connections/conn_hb9x2k/connect',
    created_at: '2026-06-11T10:00:00Z',
    updated_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ConnectionsEntity', () => {
  it('list() calls GET /connections with filters', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/connections?page=1&page_size=20&server_slug=hubspot&status=initiated',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createConnection()]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.connections.list({
      page: 1,
      page_size: 20,
      server_slug: 'hubspot',
      status: 'initiated',
    });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.server_slug).toBe('hubspot');
    expect(page.pagination.total_records).toBe(1);
  });

  it('listAll() follows pagination.next_page and stops when null', async () => {
    let call = 0;
    const fetchMock = stubFetch((url) => {
      call += 1;

      if (call === 1) {
        expect(url).toContain('page=1');
        return jsonResponse(
          createPaginatedResponse([createConnection({ id: 'conn_1' })], {
            next_page: 2,
          }),
        );
      }

      expect(url).toContain('page=2');
      return jsonResponse(
        createPaginatedResponse([createConnection({ id: 'conn_2' })], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.connections.listAll({ server_slug: 'hubspot' });

    expect(all.map((item) => item.id)).toEqual(['conn_1', 'conn_2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('initiate() calls POST /connections and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/connections');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          server_slug: 'hubspot',
          auth_config_id: 'ac_hb7x9k2m',
          name: 'HubSpot - Acme Corp',
          scopes: ['crm.objects.contacts.read'],
        }),
      );
      return jsonResponse({ data: createConnection() });
    });

    const client = new SynqedClient({ retries: false });
    const connection = await client.connections.initiate({
      server_slug: 'hubspot',
      auth_config_id: 'ac_hb7x9k2m',
      name: 'HubSpot - Acme Corp',
      scopes: ['crm.objects.contacts.read'],
    });

    expect(connection.id).toBe('conn_hb9x2k');
    expect(connection.redirect_url).toContain('conn_hb9x2k');
  });

  it('initiate() sends Idempotency-Key when provided', async () => {
    stubFetch((_url, init) => {
      const headers = getRequestHeaders(init);
      expect(headers.get('Idempotency-Key')).toBe('connection-hubspot');
      return jsonResponse({ data: createConnection() });
    });

    const client = new SynqedClient({ retries: false });

    await client.connections.initiate(
      { server_slug: 'hubspot' },
      { idempotencyKey: 'connection-hubspot' },
    );
  });

  it('getById() calls GET /connections/:id and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/connections/conn_hb9x2k');
      expect(init?.method).toBe('GET');
      return jsonResponse({ data: createConnection() });
    });

    const client = new SynqedClient({ retries: false });
    const connection = await client.connections.getById('conn_hb9x2k');

    expect(connection.id).toBe('conn_hb9x2k');
    expect(connection.connection_status).toBe('initiated');
  });

  it('delete() calls DELETE /connections/:id and returns void on 204', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/connections/conn_hb9x2k');
      expect(init?.method).toBe('DELETE');
      return new Response(null, { status: 204 });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.connections.delete('conn_hb9x2k');

    expect(result).toBeUndefined();
  });
});
