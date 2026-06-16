import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import { createPaginator } from '@/core/pagination/create-paginator';
import {
  createMcpServer,
  createMcpServerDetail,
  createMcpTool,
  createPaginatedResponse,
  getRequestHeaders,
  jsonResponse,
  stubFetch,
} from './helpers/mock-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MCPServersEntity', () => {
  it('list() returns full PaginatedResponse without unwrapping', async () => {
    stubFetch(() =>
      jsonResponse(createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')])),
    );

    const client = new SynqedClient({ retries: false });
    const page = await client.mcpServers.list();

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.slug).toBe('hubspot');
    expect(page.pagination).toBeDefined();
    expect(page.pagination.total_records).toBe(1);
  });

  it('list() calls GET /mcp-servers with pagination and search', async () => {
    const fetchMock = stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/mcp-servers?page=1&page_size=20&search=hub',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(
        createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')]),
      );
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.mcpServers.list({
      page: 1,
      page_size: 20,
      search: 'hub',
    });

    expect(page.data).toHaveLength(1);
    expect(page.pagination.total_records).toBe(1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('getBySlug() calls GET /mcp-servers/:slug and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/mcp-servers/hubspot');
      expect(init?.method).toBe('GET');
      return jsonResponse({ data: createMcpServerDetail('hubspot', 'HubSpot') });
    });

    const client = new SynqedClient({ retries: false });
    const server = await client.mcpServers.getBySlug('hubspot');

    expect(server.slug).toBe('hubspot');
    expect(server.name).toBe('HubSpot');
    expect(server.auth_methods?.[0]?.type).toBe('oauth');
    expect(server.tools?.[0]?.name).toBe('create_contact');
  });

  it('listTools() calls GET /mcp-servers/:slug/tools with search', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/mcp-servers/hubspot/tools?page=1&search=contact',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(
        createPaginatedResponse([
          createMcpTool('create_contact', {
            title: 'Create Contact',
            description: 'Create a new contact in HubSpot CRM',
          }),
        ]),
      );
    });

    const client = new SynqedClient({ retries: false });
    const tools = await client.mcpServers.listTools('hubspot', {
      page: 1,
      search: 'contact',
    });

    expect(tools.data[0]?.name).toBe('create_contact');
    expect(tools.data[0]?.title).toBe('Create Contact');
  });

  it('listAll() follows pagination.next_page and stops when null', async () => {
    let call = 0;
    const fetchMock = stubFetch((url) => {
      call += 1;

      if (call === 1) {
        expect(url).toContain('page=1');
        return jsonResponse(
          createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')], {
            next_page: 2,
          }),
        );
      }

      expect(url).toContain('page=2');
      return jsonResponse(
        createPaginatedResponse([createMcpServer('github', 'GitHub')], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.mcpServers.listAll();

    expect(all.map((item) => item.name)).toEqual(['HubSpot', 'GitHub']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('createPaginator', () => {
  it('follows response.pagination.next_page', async () => {
    const pages: number[] = [];

    const generator = createPaginator({
      fetchPage: async (page) => {
        pages.push(page);

        if (page === 1) {
          return createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')], {
            next_page: 2,
          });
        }

        return createPaginatedResponse([createMcpServer('github', 'GitHub')], {
          next_page: null,
        });
      },
    });

    const items = [];
    for await (const item of generator) {
      items.push(item.name);
    }

    expect(pages).toEqual([1, 2]);
    expect(items).toEqual(['HubSpot', 'GitHub']);
  });

  it('detects pagination loops', async () => {
    const generator = createPaginator({
      fetchPage: async () =>
        createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')], {
          next_page: 1,
        }),
    });

    await expect(async () => {
      for await (const _item of generator) {
        // consume
      }
    }).rejects.toThrow('Pagination loop detected at page 1');
  });
});

describe('list response shape', () => {
  it('supports { data, pagination }', async () => {
    stubFetch(() =>
      jsonResponse({
        data: [createMcpServer('hubspot', 'HubSpot')],
        pagination: {
          total_records: 100,
          total_pages: 5,
          current_page: 1,
          next_page: 2,
          prev_page: null,
          page_size: 20,
        },
      }),
    );

    const client = new SynqedClient({ retries: false });
    const page = await client.mcpServers.list();

    expect(page.data).toHaveLength(1);
    expect(page.pagination.total_records).toBe(100);
    expect(page.pagination.next_page).toBe(2);
  });
});

describe('request headers', () => {
  it('sends X-API-Key on requests when apiKey is configured', async () => {
    stubFetch((_url, init) => {
      const headers = getRequestHeaders(init);
      expect(headers.get('X-API-Key')).toBe('sk_test_key');
      return jsonResponse(createPaginatedResponse([]));
    });

    const client = new SynqedClient({
      apiKey: 'sk_test_key',
      retries: false,
    });

    await client.mcpServers.list();
  });
});
