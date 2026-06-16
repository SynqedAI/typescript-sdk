import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseError } from '@/core/errors/parse-error';
import { AuthenticationError } from '@/core/errors/authentication-error';
import { RateLimitError } from '@/core/errors/rate-limit-error';
import { SynqedAPIError } from '@/core/errors/api-error';
import { HttpClient } from '@/core/http/http-client';
import { parseResponse } from '@/core/http/response';
import type { ApiResponse, PaginatedResponse } from '@/core/pagination/types';
import { DEFAULT_BASE_URL } from '@/core/runtime/env';
import { joinUrl } from '@/core/utils/join-url';
import type { MCPServer, MCPServerDetail } from '@/entities/mcp-servers/types';
import {
  createMcpServer,
  createMcpServerDetail,
  createPaginatedResponse,
  emptyBodyResponse,
  jsonResponse,
  stubFetch,
  textResponse,
} from './helpers/mock-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('joinUrl', () => {
  it('preserves /v1 in base URL', () => {
    expect(joinUrl('https://api.synqed.ai/v1', '/mcp-servers')).toBe(
      'https://api.synqed.ai/v1/mcp-servers',
    );
  });

  it('normalizes trailing and leading slashes', () => {
    expect(joinUrl('https://api.synqed.ai/v1/', '/sessions')).toBe(
      'https://api.synqed.ai/v1/sessions',
    );
  });
});

describe('DEFAULT_BASE_URL', () => {
  it('is https://api.synqed.ai/v1', () => {
    expect(DEFAULT_BASE_URL).toBe('https://api.synqed.ai/v1');
  });
});

describe('parseResponse', () => {
  it('handles JSON ApiResponse', async () => {
    const response = jsonResponse({ data: { slug: 'hubspot', name: 'HubSpot' } });
    const body = await parseResponse<ApiResponse<MCPServer>>(response);

    expect(body.data.slug).toBe('hubspot');
  });

  it('handles JSON PaginatedResponse', async () => {
    const response = jsonResponse(
      createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')]),
    );
    const body = await parseResponse<PaginatedResponse<MCPServer>>(response);

    expect(body.data).toHaveLength(1);
    expect(body.pagination.current_page).toBe(1);
  });

  it('handles text response', async () => {
    const response = textResponse('ok');
    const body = await parseResponse<string>(response);

    expect(body).toBe('ok');
  });

  it('handles 204 No Content', async () => {
    const response = new Response(null, { status: 204 });
    const body = await parseResponse<void>(response);

    expect(body).toBeUndefined();
  });

  it('handles 205 Reset Content', async () => {
    const response = new Response(null, { status: 205 });
    const body = await parseResponse<void>(response);

    expect(body).toBeUndefined();
  });

  it('handles 200 with empty body', async () => {
    const response = emptyBodyResponse({ status: 200 });
    const body = await parseResponse<void>(response);

    expect(body).toBeUndefined();
  });
});

describe('HttpClient response flow', () => {
  it('returns PaginatedResponse directly for list endpoints', async () => {
    stubFetch(() =>
      jsonResponse(createPaginatedResponse([createMcpServer('hubspot', 'HubSpot')])),
    );

    const http = new HttpClient({
      baseUrl: DEFAULT_BASE_URL,
      retries: false,
    });

    const page = await http.request<PaginatedResponse<MCPServer>>(
      '/mcp-servers',
      { method: 'GET' },
    );

    expect(page.data[0]?.name).toBe('HubSpot');
    expect(page.pagination.total_records).toBe(1);
  });

  it('returns ApiResponse for single-resource endpoints before entity unwrap', async () => {
    stubFetch(() =>
      jsonResponse({ data: createMcpServerDetail('hubspot', 'HubSpot') }),
    );

    const http = new HttpClient({
      baseUrl: DEFAULT_BASE_URL,
      retries: false,
    });

    const response = await http.request<ApiResponse<MCPServerDetail>>(
      '/mcp-servers/hubspot',
      { method: 'GET' },
    );

    expect(response.data.slug).toBe('hubspot');
  });

  it('returns undefined for empty-body success responses', async () => {
    stubFetch(() => new Response(null, { status: 204 }));

    const http = new HttpClient({
      baseUrl: DEFAULT_BASE_URL,
      retries: false,
    });

    const result = await http.request<void>('/resource/gw_1', {
      method: 'DELETE',
    });

    expect(result).toBeUndefined();
  });
});

describe('parseError', () => {
  it('reads body.error.code', async () => {
    const error = await parseError(
      jsonResponse(
        { error: { code: 'validation_failed', message: 'Invalid' } },
        { status: 400 },
      ),
    );

    expect(error).toBeInstanceOf(SynqedAPIError);
    expect(error.code).toBe('validation_failed');
  });

  it('reads body.error.message', async () => {
    const error = await parseError(
      jsonResponse(
        { error: { code: 'bad_request', message: 'Bad request' } },
        { status: 400 },
      ),
    );

    expect(error.message).toBe('Bad request');
  });

  it('reads body.error.details', async () => {
    const error = await parseError(
      jsonResponse(
        {
          error: {
            code: 'validation_failed',
            message: 'Request validation failed',
            details: [{ field: 'name', reason: 'required' }],
          },
        },
        { status: 400 },
      ),
    );

    expect(error.details).toEqual([{ field: 'name', reason: 'required' }]);
  });

  it('captures X-Request-ID from response headers', async () => {
    const error = await parseError(
      jsonResponse(
        { error: { code: 'not_found', message: 'Not found' } },
        { status: 404, headers: { 'X-Request-ID': 'req_abc' } },
      ),
    );

    expect(error.requestId).toBe('req_abc');
  });

  it('maps 401 to AuthenticationError', async () => {
    const error = await parseError(
      jsonResponse(
        { error: { code: 'unauthorized', message: 'Invalid API key' } },
        { status: 401 },
      ),
    );

    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it('maps 429 to RateLimitError', async () => {
    const error = await parseError(
      jsonResponse(
        { error: { code: 'rate_limited', message: 'Too many requests' } },
        { status: 429 },
      ),
    );

    expect(error).toBeInstanceOf(RateLimitError);
  });

  it('captures rate limit headers on RateLimitError', async () => {
    const error = await parseError(
      jsonResponse(
        { error: { code: 'rate_limited', message: 'Too many requests' } },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '1710000000',
          },
        },
      ),
    );

    expect(error).toBeInstanceOf(RateLimitError);
    if (error instanceof RateLimitError) {
      expect(error.rateLimit).toEqual({
        limit: 100,
        remaining: 0,
        reset: '1710000000',
      });
    }
  });

  it('SynqedAPIError contains code, details, and requestId', async () => {
    const error = await parseError(
      jsonResponse(
        {
          error: {
            code: 'validation_failed',
            message: 'Request validation failed',
            details: [{ field: 'user_id', reason: 'required' }],
          },
        },
        { status: 422, headers: { 'X-Request-ID': 'req_xyz' } },
      ),
    );

    expect(error).toBeInstanceOf(SynqedAPIError);
    expect(error.code).toBe('validation_failed');
    expect(error.details).toEqual([{ field: 'user_id', reason: 'required' }]);
    expect(error.requestId).toBe('req_xyz');
  });
});
