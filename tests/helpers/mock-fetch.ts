import { vi } from 'vitest';
import type { PaginatedResponse } from '@/core/pagination/types';
import type { MCPServer } from '@/entities/mcp-servers/types';

export function createMcpServer(id: string, name: string): MCPServer {
  return {
    id,
    name,
    transport: 'stdio',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

export function createPaginatedResponse(
  data: MCPServer[],
  overrides: Partial<PaginatedResponse<MCPServer>> = {},
): PaginatedResponse<MCPServer> {
  return {
    data,
    current_page: 1,
    next_page: null,
    page_size: 25,
    prev_page: null,
    total_pages: 1,
    total_records: data.length,
    ...overrides,
  };
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit = { status: 200 },
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export function createMockFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (init?.signal?.aborted) {
      return Promise.reject(
        init.signal.reason ?? new DOMException('Aborted', 'AbortError'),
      );
    }

    return Promise.resolve(handler(url, init));
  }) as typeof fetch;
}

export function stubFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const mock = createMockFetch(handler);
  vi.stubGlobal('fetch', mock);
  return mock;
}
