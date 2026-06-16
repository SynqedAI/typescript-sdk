import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynqedClient } from '@/client/synqed-client';
import type {
  AuthConfig,
  AuthConfigListItem,
} from '@/entities/auth-configs/types';
import {
  createPaginatedResponse,
  getRequestHeaders,
  jsonResponse,
  stubFetch,
} from './helpers/mock-fetch';

function createAuthConfigListItem(
  overrides: Partial<AuthConfigListItem> = {},
): AuthConfigListItem {
  return {
    id: 'ac_hb7x9k2m',
    name: 'HubSpot OAuth - Production',
    status: 'enabled',
    is_default: false,
    auth_method: { name: 'HubSpot OAuth', type: 'oauth' },
    server: {
      name: 'HubSpot',
      slug: 'hubspot',
      logo_url: 'https://cdn.synqed.ai/logos/hubspot.png',
    },
    created_at: '2026-06-11T10:00:00Z',
    updated_at: '2026-06-11T10:00:00Z',
    ...overrides,
  };
}

function createAuthConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  return {
    ...createAuthConfigListItem(),
    scopes: [{ scope_key: 'crm.objects.contacts.read', is_required: true }],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuthConfigsEntity', () => {
  it('list() calls GET /auth-configs with filters', async () => {
    stubFetch((url, init) => {
      expect(url).toBe(
        'https://api.synqed.ai/v1/auth-configs?page=1&page_size=20&server_slug=hubspot&status=enabled&sort_by=name&sort_order=asc',
      );
      expect(init?.method).toBe('GET');
      return jsonResponse(
        createPaginatedResponse([createAuthConfigListItem()]),
      );
    });

    const client = new SynqedClient({ retries: false });
    const page = await client.authConfigs.list({
      page: 1,
      page_size: 20,
      server_slug: 'hubspot',
      status: 'enabled',
      sort_by: 'name',
      sort_order: 'asc',
    });

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.server.slug).toBe('hubspot');
    expect(page.pagination.total_records).toBe(1);
  });

  it('create() calls POST /auth-configs and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/auth-configs');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(
        JSON.stringify({
          auth_method_type: 'oauth',
          name: 'HubSpot OAuth - Production',
          server_slug: 'hubspot',
          scopes: ['crm.objects.contacts.read'],
        }),
      );
      return jsonResponse({ data: createAuthConfig() });
    });

    const client = new SynqedClient({ retries: false });
    const authConfig = await client.authConfigs.create({
      auth_method_type: 'oauth',
      name: 'HubSpot OAuth - Production',
      server_slug: 'hubspot',
      scopes: ['crm.objects.contacts.read'],
    });

    expect(authConfig.id).toBe('ac_hb7x9k2m');
    expect(authConfig.scopes?.[0]?.scope_key).toBe('crm.objects.contacts.read');
  });

  it('create() sends Idempotency-Key when provided', async () => {
    stubFetch((_url, init) => {
      const headers = getRequestHeaders(init);
      expect(headers.get('Idempotency-Key')).toBe('auth-config-hubspot');
      return jsonResponse({ data: createAuthConfig() });
    });

    const client = new SynqedClient({ retries: false });

    await client.authConfigs.create(
      {
        auth_method_type: 'oauth',
        name: 'HubSpot OAuth - Production',
        server_slug: 'hubspot',
      },
      { idempotencyKey: 'auth-config-hubspot' },
    );
  });

  it('listAll() follows pagination.next_page and stops when null', async () => {
    let call = 0;
    const fetchMock = stubFetch((url) => {
      call += 1;

      if (call === 1) {
        expect(url).toContain('page=1');
        expect(url).toContain('server_slug=hubspot');
        return jsonResponse(
          createPaginatedResponse([createAuthConfigListItem({ id: 'ac_1' })], {
            next_page: 2,
          }),
        );
      }

      expect(url).toContain('page=2');
      return jsonResponse(
        createPaginatedResponse([createAuthConfigListItem({ id: 'ac_2' })], {
          next_page: null,
        }),
      );
    });

    const client = new SynqedClient({ retries: false });
    const all = await client.authConfigs.listAll({ server_slug: 'hubspot' });

    expect(all.map((item) => item.id)).toEqual(['ac_1', 'ac_2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('getById() calls GET /auth-configs/:id and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/auth-configs/ac_hb7x9k2m');
      expect(init?.method).toBe('GET');
      return jsonResponse({ data: createAuthConfig() });
    });

    const client = new SynqedClient({ retries: false });
    const authConfig = await client.authConfigs.getById('ac_hb7x9k2m');

    expect(authConfig.id).toBe('ac_hb7x9k2m');
    expect(authConfig.name).toBe('HubSpot OAuth - Production');
  });

  it('update() calls PATCH /auth-configs/:id and unwraps ApiResponse.data', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/auth-configs/ac_hb7x9k2m');
      expect(init?.method).toBe('PATCH');
      expect(init?.body).toBe(
        JSON.stringify({
          name: 'HubSpot OAuth - Staging',
          oauth_override: { client_id: 'new-client-id' },
        }),
      );
      return jsonResponse({
        data: createAuthConfig({ name: 'HubSpot OAuth - Staging' }),
      });
    });

    const client = new SynqedClient({ retries: false });
    const authConfig = await client.authConfigs.update('ac_hb7x9k2m', {
      name: 'HubSpot OAuth - Staging',
      oauth_override: { client_id: 'new-client-id' },
    });

    expect(authConfig.name).toBe('HubSpot OAuth - Staging');
  });

  it('delete() calls DELETE /auth-configs/:id and returns void on 204', async () => {
    stubFetch((url, init) => {
      expect(url).toBe('https://api.synqed.ai/v1/auth-configs/ac_hb7x9k2m');
      expect(init?.method).toBe('DELETE');
      return new Response(null, { status: 204 });
    });

    const client = new SynqedClient({ retries: false });
    const result = await client.authConfigs.delete('ac_hb7x9k2m');

    expect(result).toBeUndefined();
  });
});
