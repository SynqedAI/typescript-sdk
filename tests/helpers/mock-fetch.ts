import { vi } from 'vitest';
import type { PaginatedResponse } from '@/core/pagination/types';
import type { MCPServer, MCPServerDetail, MCPTool } from '@/entities/mcp-servers/types';
import type { Session } from '@/entities/sessions/types';

export function createMcpServer(
  slug: string,
  name: string,
  overrides: Partial<MCPServer> = {},
): MCPServer {
  return {
    slug,
    name,
    description: `${name} MCP server`,
    logo_url: `https://cdn.synqed.ai/logos/${slug}.png`,
    total_tools: 24,
    ...overrides,
  };
}

export function createMcpServerDetail(
  slug: string,
  name: string,
  overrides: Partial<MCPServerDetail> = {},
): MCPServerDetail {
  return {
    slug,
    name,
    description: `${name} MCP server for managing contacts, deals, and tickets`,
    logo_url: `https://cdn.synqed.ai/logos/${slug}.png`,
    service_url: `https://mcp.synqed.ai/servers/${slug}`,
    auth_methods: [
      {
        name: 'OAuth 2.0',
        type: 'oauth',
        scopes: [
          {
            scope_key: 'crm.objects.contacts.read',
            description: 'Read contacts from your CRM',
            is_required: true,
          },
        ],
      },
    ],
    tools: [
      {
        name: 'create_contact',
        title: 'Create Contact',
        description: 'Create a new contact',
      },
    ],
    ...overrides,
  };
}

export function createMcpTool(
  name: string,
  overrides: Partial<MCPTool> = {},
): MCPTool {
  return {
    name,
    title: name,
    description: `Tool: ${name}`,
    ...overrides,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  paginationOverrides: Partial<PaginatedResponse<T>['pagination']> = {},
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      current_page: 1,
      next_page: null,
      page_size: 20,
      prev_page: null,
      total_pages: 1,
      total_records: data.length,
      ...paginationOverrides,
    },
  };
}

export function createSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'sess_123',
    user_id: 'user_12345',
    gateway_id: 'gw_abc123',
    status: 'active',
    mcp: {
      url: 'https://mcp.synqed.ai/sess_123',
      headers: { Authorization: 'Bearer token' },
    },
    connections: [],
    created_at: '2026-01-01T00:00:00Z',
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

export function textResponse(
  body: string,
  init: ResponseInit = { status: 200 },
): Response {
  return new Response(body, {
    ...init,
    headers: {
      'content-type': 'text/plain',
      ...(init.headers ?? {}),
    },
  });
}

export function emptyBodyResponse(init: ResponseInit = { status: 200 }): Response {
  return new Response('', {
    ...init,
    headers: init.headers ?? {},
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

export function getRequestHeaders(init?: RequestInit): Headers {
  return new Headers(init?.headers);
}
