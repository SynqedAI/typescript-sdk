import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import type { Trace } from '@/entities/traces/types';
import { createPaginatedResponse, jsonResponse, stubFetch } from './helpers/mock-fetch';

function createTrace(overrides: Partial<Trace> = {}): Trace {
  return {
    id: 'tr_9xk2mfp',
    user_id: 'usr_acme_sales_42',
    gateway_id: 'gw_crm2x8fp',
    gateway_name: 'CRM Gateway',
    instance_id: 'inst_acme42x',
    instance_name: 'Acme Corp - Sales Team',
    session_id: 'ses_7fp2xk9',
    server_name: 'HubSpot',
    server_slug: 'hubspot',
    rpc_method: 'tools/call',
    entity_name: 'create_contact',
    duration_ms: 185.2,
    upstream_duration_ms: 142.7,
    error: '',
    timestamp: '2026-06-11T10:00:00Z',
    created_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TracesEntity', () => {
  it('list() calls GET /traces with filters', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/traces?page=1&page_size=20&gateway_id=gw_crm2x8fp&instance_id=inst_acme42x&server_slug=hubspot&methods=tools%2Fcall%2Ctools%2Flist&search=contact&from=2026-06-01&to=2026-06-30',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(createPaginatedResponse([createTrace()]));
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.traces.list({
      page: 1,
      page_size: 20,
      gateway_id: 'gw_crm2x8fp',
      instance_id: 'inst_acme42x',
      server_slug: 'hubspot',
      methods: 'tools/call,tools/list',
      search: 'contact',
      from: '2026-06-01',
      to: '2026-06-30',
    });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.rpc_method).toBe('tools/call');
    expect(page.pagination.total_records).toBe(1);
  });

  it('listAll() follows pagination.next_page', async () => {
    let call = 0;
    const fetchMock = stubFetch((url) => {
      call += 1;

      if (call === 1) {
        return jsonResponse(
          createPaginatedResponse([createTrace({ id: 'tr_1' })], {
            next_page: 2,
          }),
        );
      }

      return jsonResponse(
        createPaginatedResponse([createTrace({ id: 'tr_2' })], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.traces.listAll({ gateway_id: 'gw_crm2x8fp' });

    expect(all.map((item) => item.id)).toEqual(['tr_1', 'tr_2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('getById() calls GET /traces/:id and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/traces/tr_9xk2mfp');
      expect(init?.method).toBe('GET');
      return jsonResponse({ data: createTrace() });
    });

    const client = new SynqedClient({ retries: false });
    const trace = await client.traces.getById('tr_9xk2mfp');

    expect(trace.id).toBe('tr_9xk2mfp');
    expect(trace.entity_name).toBe('create_contact');
    expect(trace.duration_ms).toBe(185.2);
  });
});
