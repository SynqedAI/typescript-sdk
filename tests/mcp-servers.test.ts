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
});

describe('MCPServersEntity', () => {
  it('list() builds correct URL', async () => {
    const fetchMock = stubFetch((url) => {
      expect(url).toBe(
        'https://api.synqed.ai/mcp-servers?page=1&page_size=25',
      );
      return jsonResponse(createPaginatedResponse([createMcpServer('1', 'A')]));
    });

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

    const page = await client.mcpServers.list({ page: 1, page_size: 25 });
    expect(page.data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('iterate() fetches multiple pages', async () => {
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

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

    const names: string[] = [];
    for await (const server of client.mcpServers.iterate({ page_size: 25 })) {
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

    const client = new SynqedClient({
      baseUrl: 'https://api.synqed.ai',
      retries: false,
    });

    const all = await client.mcpServers.listAll();
    expect(all.map((item) => item.name)).toEqual(['A', 'B']);
  });
});
