import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import { createPaginator } from '@/core/pagination/create-paginator';
import {
  createMcpServer,
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
      jsonResponse(createPaginatedResponse([createMcpServer('1', 'A')])),
    );

    const client = new SynqedClient({ retries: false });
    const page = await client.mcpServers.list();

    expect(page.data).toHaveLength(1);
    expect(page.pagination).toBeDefined();
    expect(page.pagination.total_records).toBe(1);
  });

  it('list() calls GET /mcp-servers', async () => {
    const fetchMock = stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/mcp-servers?page=1&page_size=20',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createMcpServer('1', 'A')]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.mcpServers.list({ page: 1, page_size: 20 });

    expect(page.data).toHaveLength(1);
    expect(page.pagination.total_records).toBe(1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retrieve() unwraps ApiResponse.data', async () => {
    stubFetch((url) => {
      expect(url).toBe('https://api.synqed.ai/v1/mcp-servers/gw_1');
      return jsonResponse({ data: createMcpServer('gw_1', 'Server A') });
    });

    const client = new SynqedClient({ retries: false });
    const server = await client.mcpServers.retrieve('gw_1');

    expect(server.id).toBe('gw_1');
    expect(server.name).toBe('Server A');
  });

  it('listTools() calls GET /mcp-servers/:id/tools', async () => {
    stubFetch((url) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/mcp-servers/gw_1/tools?page=1',
      );
      return jsonResponse(
        createPaginatedResponse([
          { name: 'search', description: 'Search the web' },
        ]),
      );
    });

    const client = new SynqedClient({ retries: false });
    const tools = await client.mcpServers.listTools('gw_1', { page: 1 });

    expect(tools.data[0]?.name).toBe('search');
  });

  it('iterate() fetches multiple pages via pagination.next_page', async () => {
    let call = 0;
    const fetchMock = stubFetch((url) => {
      call += 1;

      if (call === 1) {
        expect(url).toContain('page=1');
        return jsonResponse(
          createPaginatedResponse([createMcpServer('1', 'A')], {
            current_page: 1,
            next_page: 2,
            total_pages: 2,
          }),
        );
      }

      expect(url).toContain('page=2');
      return jsonResponse(
        createPaginatedResponse([createMcpServer('2', 'B')], {
          current_page: 2,
          next_page: null,
          total_pages: 2,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const names: string[] = [];

    for await (const server of client.mcpServers.iterate({ page_size: 20 })) {
      names.push(server.name);
    }

    expect(names).toEqual(['A', 'B']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('listAll() returns full array', async () => {
    stubFetch((url) => {
      if (url.includes('page=1')) {
        return jsonResponse(
          createPaginatedResponse([createMcpServer('1', 'A')], {
            next_page: 2,
          }),
        );
      }

      return jsonResponse(
        createPaginatedResponse([createMcpServer('2', 'B')], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.mcpServers.listAll();

    expect(all.map((item) => item.name)).toEqual(['A', 'B']);
  });
});

describe('createPaginator', () => {
  it('follows response.pagination.next_page', async () => {
    const pages: number[] = [];

    const generator = createPaginator({
      fetchPage: async (page) => {
        pages.push(page);

        if (page === 1) {
          return createPaginatedResponse([createMcpServer('1', 'A')], {
            next_page: 2,
          });
        }

        return createPaginatedResponse([createMcpServer('2', 'B')], {
          next_page: null,
        });
      },
    });

    const items = [];
    for await (const item of generator) {
      items.push(item.name);
    }

    expect(pages).toEqual([1, 2]);
    expect(items).toEqual(['A', 'B']);
  });

  it('detects pagination loops', async () => {
    const generator = createPaginator({
      fetchPage: async () =>
        createPaginatedResponse([createMcpServer('1', 'A')], {
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
        data: [createMcpServer('1', 'A')],
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
