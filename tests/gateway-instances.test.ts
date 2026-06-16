import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import type {
  ConnectionLink,
  GatewayInstance,
  GatewayInstanceConnection,
} from '@/entities/gateway-instances/types';
import {
  createPaginatedResponse,
  getRequestHeaders,
  jsonResponse,
  stubFetch,
} from './helpers/mock-fetch';

const GATEWAY_ID = 'gw_crm2x8fp';
const INSTANCE_ID = 'inst_acme42x';

function createGatewayInstance(
  overrides: Partial<GatewayInstance> = {},
): GatewayInstance {
  return {
    id: INSTANCE_ID,
    gateway_id: GATEWAY_ID,
    user_id: 'usr_acme_sales_42',
    name: 'Acme Corp - Sales Team',
    slug: 'acme-corp-sales-team',
    status: 'enabled',
    instance_status: 'enabled',
    created_at: '2026-06-11T10:00:00Z',
    updated_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

function createInstanceConnection(
  overrides: Partial<GatewayInstanceConnection> = {},
): GatewayInstanceConnection {
  return {
    connection_id: 'conn_hb9x2k',
    connection_status: 'connected',
    server_name: 'HubSpot',
    server_slug: 'hubspot',
    logo_url: 'https://cdn.synqed.ai/logos/hubspot.png',
    created_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

function createConnectionLink(
  overrides: Partial<ConnectionLink> = {},
): ConnectionLink {
  return {
    connection_id: 'conn_hb9x2k',
    connection_status: 'initiated',
    redirect_url:
      'https://mcp.synqed.ai/api/connections/conn_hb9x2k/connect',
    server_name: 'HubSpot',
    server_slug: 'hubspot',
    created_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GatewayInstancesEntity', () => {
  it('list() calls GET /gateways/:gateway_id/instances with filters', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/gateways/gw_crm2x8fp/instances?page=1&page_size=20&user_id=usr_acme_sales_42',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createGatewayInstance()]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.gatewayInstances.list(GATEWAY_ID, {
      page: 1,
      page_size: 20,
      user_id: 'usr_acme_sales_42',
    });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.gateway_id).toBe(GATEWAY_ID);
  });

  it('listAll() follows pagination.next_page', async () => {
    let call = 0;
    const fetchMock = stubFetch((url) => {
      call += 1;

      if (call === 1) {
        return jsonResponse(
          createPaginatedResponse([createGatewayInstance({ id: 'inst_1' })], {
            next_page: 2,
          }),
        );
      }

      return jsonResponse(
        createPaginatedResponse([createGatewayInstance({ id: 'inst_2' })], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.gatewayInstances.listAll(GATEWAY_ID);

    expect(all.map((item) => item.id)).toEqual(['inst_1', 'inst_2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('create() calls POST /gateways/:gateway_id/instances', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/gateways/gw_crm2x8fp/instances',
      );
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          user_id: 'usr_acme_sales_42',
          name: 'Acme Corp - Sales Team',
        }),
      );
      return jsonResponse({ data: createGatewayInstance() });
    });

    const client = new SynqedClient({ retries: false });
    const instance = await client.gatewayInstances.create(GATEWAY_ID, {
      user_id: 'usr_acme_sales_42',
      name: 'Acme Corp - Sales Team',
    });

    expect(instance.id).toBe(INSTANCE_ID);
  });

  it('connect() calls POST /gateways/:gateway_id/instances/:id/connect', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/gateways/gw_crm2x8fp/instances/inst_acme42x/connect',
      );
      expect(init?.method).toBe('POST');
      return jsonResponse({
        data: {
          mcp: {
            url: 'https://mcp.synqed.ai/mcp-proxy-api/v1/acme-corp-sales-team/mcp',
            headers: { Authorization: 'Bearer token' },
          },
        },
      });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.gatewayInstances.connect(
      GATEWAY_ID,
      INSTANCE_ID,
    );

    expect(result.mcp.url).toContain('acme-corp-sales-team');
    expect(result.mcp.headers.Authorization).toBe('Bearer token');
  });

  it('listConnections() calls GET .../instances/:id/connections', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/gateways/gw_crm2x8fp/instances/inst_acme42x/connections?page=1&status=connected',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(
        createPaginatedResponse([createInstanceConnection()]),
      );
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.gatewayInstances.listConnections(
      GATEWAY_ID,
      INSTANCE_ID,
      { page: 1, status: 'connected' },
    );

    expect(page.data[0]?.server_slug).toBe('hubspot');
  });

  it('createConnectionLink() calls POST .../instances/:id/connections', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/gateways/gw_crm2x8fp/instances/inst_acme42x/connections',
      );
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          server_slug: 'hubspot',
          scopes: ['crm.objects.contacts.read'],
        }),
      );
      return jsonResponse({ data: createConnectionLink() });
    });

    const client = new SynqedClient({ retries: false });
    const link = await client.gatewayInstances.createConnectionLink(
      GATEWAY_ID,
      INSTANCE_ID,
      {
        server_slug: 'hubspot',
        scopes: ['crm.objects.contacts.read'],
      },
    );

    expect(link.redirect_url).toContain('conn_hb9x2k');
  });

  it('createConnectionLink() sends Idempotency-Key when provided', async () => {
    stubFetch((_url, init) => {
      const headers = getRequestHeaders(init);
      expect(headers.get('Idempotency-Key')).toBe('link-hubspot');
      return jsonResponse({ data: createConnectionLink() });
    });

    const client = new SynqedClient({ retries: false });

    await client.gatewayInstances.createConnectionLink(
      GATEWAY_ID,
      INSTANCE_ID,
      { server_slug: 'hubspot' },
      { idempotencyKey: 'link-hubspot' },
    );
  });
});
