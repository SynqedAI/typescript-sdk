import { describe, expect, it } from 'vitest';
import { buildHeaders } from '@/core/http/headers';

describe('buildHeaders', () => {
  it('uses X-API-Key, not Authorization', () => {
    const headers = buildHeaders({
      apiKey: 'sk_live_abc123',
      hasBody: false,
    }) as Record<string, string>;

    expect(headers['X-API-Key']).toBe('sk_live_abc123');
    expect(headers.Authorization).toBeUndefined();
  });

  it('includes X-Request-ID when requestId is passed', () => {
    const headers = buildHeaders({
      requestId: 'req_123',
      hasBody: false,
    }) as Record<string, string>;

    expect(headers['X-Request-ID']).toBe('req_123');
  });

  it('includes Idempotency-Key when idempotencyKey is passed', () => {
    const headers = buildHeaders({
      idempotencyKey: 'session-user-12345',
      hasBody: true,
    }) as Record<string, string>;

    expect(headers['Idempotency-Key']).toBe('session-user-12345');
  });

  it('adds Content-Type only when request body exists', () => {
    const withBody = buildHeaders({ hasBody: true }) as Record<string, string>;
    const withoutBody = buildHeaders({ hasBody: false }) as Record<
      string,
      string
    >;

    expect(withBody['Content-Type']).toBe('application/json');
    expect(withoutBody['Content-Type']).toBeUndefined();
  });

});
