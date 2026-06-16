import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import type {
  Gateway,
  GatewayServer,
  GatewayTool,
} from '@/entities/gateways/types';
import { createPaginatedResponse, jsonResponse, stubFetch } from './helpers/mock-fetch';

const GATEWAY_ID = 'gw_crm2x8fp';

function createGateway(overrides: Partial<Gateway> = {}): Gateway {
  return {
    id: GATEWAY_ID,
    name: 'CRM Gateway',
    slug: 'crm-gateway',
    description: 'Gateway for CRM integrations with HubSpot and Zendesk',
    exposure_mode: 'dynamic',
    gateway_status: 'enabled',
    status: 'enabled',
    include_all_servers: false,
    created_at: '2026-06-11T10:00:00Z',
    updated_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

function createGatewayServer(
  overrides: Partial<GatewayServer> = {},
): GatewayServer {
  return {
    server_slug: 'hubspot',
    server_name: 'HubSpot',
    description: 'HubSpot CRM server for managing contacts, deals, and tickets',
    logo_url: 'https://cdn.synqed.ai/logos/hubspot.png',
    connection_status: 'connected',
    active_tool_count: 12,
    total_tool_count: 24,
    auth_config: {
      id: 'ac_hb7x9k2m',
      name: 'HubSpot OAuth - Production',
      auth_method_type: 'oauth',
      status: 'enabled',
    },
    created_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

function createGatewayTool(overrides: Partial<GatewayTool> = {}): GatewayTool {
  return {
    name: 'create_contact',
    title: 'Create Contact',
    description: 'Create a new contact in HubSpot CRM',
    server_slug: 'hubspot',
    server_name: 'HubSpot',
    enabled: true,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GatewaysEntity', () => {
  it('list() calls GET /gateways with filters', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/gateways?page=1&page_size=20&status=enabled',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createGateway()]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.gateways.list({
      page: 1,
      page_size: 20,
      status: 'enabled',
    });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.slug).toBe('crm-gateway');
  });

  it('listAll() follows pagination.next_page', async () => {
    let call = 0;
    const fetchMock = stubFetch(() => {
      call += 1;

      if (call === 1) {
        return jsonResponse(
          createPaginatedResponse([createGateway({ id: 'gw_1' })], {
            next_page: 2,
          }),
        );
      }

      return jsonResponse(
        createPaginatedResponse([createGateway({ id: 'gw_2' })], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.gateways.listAll({ status: 'enabled' });

    expect(all.map((item) => item.id)).toEqual(['gw_1', 'gw_2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('create() calls POST /gateways and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/gateways');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          name: 'CRM Gateway',
          exposure_mode: 'dynamic',
          include_all_servers: false,
        }),
      );
      return jsonResponse({ data: createGateway() }, { status: 201 });
    });

    const client = new SynqedClient({ retries: false });
    const gateway = await client.gateways.create({
      name: 'CRM Gateway',
      exposure_mode: 'dynamic',
      include_all_servers: false,
    });

    expect(gateway.id).toBe(GATEWAY_ID);
  });

  it('getById() calls GET /gateways/:id', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(`https://api.synqed.ai/v1/gateways/${GATEWAY_ID}`);
      expect(init?.method).toBe('GET');
      return jsonResponse({ data: createGateway() });
    });

    const client = new SynqedClient({ retries: false });
    const gateway = await client.gateways.getById(GATEWAY_ID);

    expect(gateway.name).toBe('CRM Gateway');
  });

  it('update() calls PATCH /gateways/:id', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(`https://api.synqed.ai/v1/gateways/${GATEWAY_ID}`);
      expect(init?.method).toBe('PATCH');
      expect(init?.body).toBe(
        JSON.stringify({ name: 'CRM Gateway v2', include_all_servers: true }),
      );
      return jsonResponse({
        data: createGateway({ name: 'CRM Gateway v2', include_all_servers: true }),
      });
    });

    const client = new SynqedClient({ retries: false });
    const gateway = await client.gateways.update(GATEWAY_ID, {
      name: 'CRM Gateway v2',
      include_all_servers: true,
    });

    expect(gateway.name).toBe('CRM Gateway v2');
    expect(gateway.include_all_servers).toBe(true);
  });

  it('delete() calls DELETE /gateways/:id and returns void on 204', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(`https://api.synqed.ai/v1/gateways/${GATEWAY_ID}`);
      expect(init?.method).toBe('DELETE');
      return new Response(null, { status: 204 });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.gateways.delete(GATEWAY_ID);

    expect(result).toBeUndefined();
  });

  it('listServers() calls GET /gateways/:id/servers', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        `https://api.synqed.ai/v1/gateways/${GATEWAY_ID}/servers?page=1&page_size=20`,
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createGatewayServer()]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.gateways.listServers(GATEWAY_ID, {
      page: 1,
      page_size: 20,
    });

    expect(page.data[0]?.server_slug).toBe('hubspot');
  });

  it('addServer() calls POST /gateways/:id/servers', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(`https://api.synqed.ai/v1/gateways/${GATEWAY_ID}/servers`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          server_slug: 'zendesk',
          auth_config_id: 'ac_zd4p8n1q',
        }),
      );
      return jsonResponse({ data: createGatewayServer({ server_slug: 'zendesk' }) }, { status: 201 });
    });

    const client = new SynqedClient({ retries: false });
    const server = await client.gateways.addServer(GATEWAY_ID, {
      server_slug: 'zendesk',
      auth_config_id: 'ac_zd4p8n1q',
    });

    expect(server.server_slug).toBe('zendesk');
  });

  it('removeServer() calls DELETE /gateways/:id/servers/:server_slug', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        `https://api.synqed.ai/v1/gateways/${GATEWAY_ID}/servers/hubspot`,
      );
      expect(init?.method).toBe('DELETE');
      return new Response(null, { status: 204 });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.gateways.removeServer(GATEWAY_ID, 'hubspot');

    expect(result).toBeUndefined();
  });

  it('listTools() calls GET /gateways/:id/tools with filters', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        `https://api.synqed.ai/v1/gateways/${GATEWAY_ID}/tools?page=1&server_slug=hubspot&search=contact`,
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createGatewayTool()]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.gateways.listTools(GATEWAY_ID, {
      page: 1,
      server_slug: 'hubspot',
      search: 'contact',
    });

    expect(page.data[0]?.name).toBe('create_contact');
  });

  it('addTools() calls POST /gateways/:id/tools', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(`https://api.synqed.ai/v1/gateways/${GATEWAY_ID}/tools`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          server_slug: 'hubspot',
          tools: ['create_contact', 'update_deal'],
        }),
      );
      return jsonResponse({
        data: {
          server_slug: 'hubspot',
          added: ['create_contact', 'update_deal'],
          active_tool_count: 12,
          total_tool_count: 24,
        },
      });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.gateways.addTools(GATEWAY_ID, {
      server_slug: 'hubspot',
      tools: ['create_contact', 'update_deal'],
    });

    expect(result.added).toEqual(['create_contact', 'update_deal']);
  });

  it('removeTools() calls DELETE /gateways/:id/tools with body', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(`https://api.synqed.ai/v1/gateways/${GATEWAY_ID}/tools`);
      expect(init?.method).toBe('DELETE');
      expect(init?.body).toBe(
        JSON.stringify({
          server_slug: 'hubspot',
          tools: ['list_tickets'],
        }),
      );
      return jsonResponse({
        data: {
          server_slug: 'hubspot',
          removed: ['list_tickets'],
          active_tool_count: 11,
          total_tool_count: 24,
        },
      });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.gateways.removeTools(GATEWAY_ID, {
      server_slug: 'hubspot',
      tools: ['list_tickets'],
    });

    expect(result.removed).toEqual(['list_tickets']);
  });
});
