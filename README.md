# @synqedai/typescript

Official TypeScript SDK for the [SynqedAI](https://synqed.ai) API.

- **ESM + CJS** — `dist/index.mjs` and `dist/index.cjs`
- **TypeScript** — strict types and `.d.ts` declarations
- **Zero runtime dependencies**
- **Node.js 18+** — uses native `fetch`

## Installation

```bash
npm install @synqedai/typescript
```

## Quick start

Set environment variables in your app (the SDK reads `process.env` but does not load `.env` for you):

```bash
export SYNQEDAI_API_KEY=your_api_key
export SYNQEDAI_BASE_URL=https://api.synqed.ai/v1
```

```typescript
import { SynqedClient } from '@synqedai/typescript';

const client = new SynqedClient({
  apiKey: process.env.SYNQEDAI_API_KEY,
});
```

## Create or get a session

The recommended integration path is `POST /sessions`:

```typescript
const session = await client.sessions.create(
  {
    user_id: 'usr_acme_sales_42',
    gateway: {
      name: 'CRM Gateway',
      exposure_mode: 'dynamic',
      include_all_servers: true,
    },
  },
  {
    idempotencyKey: 'session-user-12345',
    requestId: 'req_123',
  },
);

// Or use an existing gateway
const sessionWithGateway = await client.sessions.create({
  user_id: 'usr_acme_sales_42',
  gateway_id: 'gw_crm2x8fp',
});

console.log(session.mcp.url);

const existing = await client.sessions.getById('inst_acme42x');
```

## Discover MCP servers

```typescript
const response = await client.mcpServers.list({
  page: 1,
  page_size: 20,
  search: 'hubspot',
});

console.log(response.data);
console.log(response.pagination);

const server = await client.mcpServers.getBySlug('hubspot');
const tools = await client.mcpServers.listTools('hubspot', { page: 1 });

// SDK convenience helper — fetches all pages internally
const allServers = await client.mcpServers.listAll({ search: 'hubspot' });
```

### CommonJS

```javascript
const { SynqedClient } = require('@synqedai/typescript');
```

## Configuration

```typescript
interface SynqedClientConfig {
  apiKey?: string;       // or SYNQEDAI_API_KEY
  baseUrl?: string;      // or SYNQEDAI_BASE_URL (default: https://api.synqed.ai/v1)
  timeoutMs?: number;    // default: 30000
  debug?: boolean;       // log requests/responses to console
  retries?: RetryConfig | false;     // default: retry enabled
}
```

Config priority: **constructor options → environment variables → defaults**.

Per-request options (`RequestOptions`):

```typescript
{
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;  // sends Idempotency-Key header
  requestId?: string;        // sends X-Request-ID header
}
```

## MCP Servers

| Method | Description |
|--------|-------------|
| `list(params?, options?)` | Fetch a single page |
| `listAll(params?, options?)` | SDK convenience — fetch all pages into an array |
| `getBySlug(slug, options?)` | Get MCP server details by slug |
| `listTools(slug, params?, options?)` | List tools for an MCP server |

### Pagination response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    next_page: number | null;
    page_size: number;
    prev_page: number | null;
    total_pages: number;
    total_records: number;
  };
}
```

## Auth Configs

| Method | Description |
|--------|-------------|
| `list(params?, options?)` | Fetch a single page |
| `listAll(params?, options?)` | SDK convenience — fetch all pages into an array |
| `getById(id, options?)` | Get one auth config by ID |
| `create(body, options?)` | Create an auth config |
| `update(id, body, options?)` | Update an auth config |
| `delete(id, options?)` | Delete an auth config |

```typescript
const page = await client.authConfigs.list({
  page: 1,
  page_size: 20,
  server_slug: 'hubspot',
});

const authConfig = await client.authConfigs.getById('ac_hb7x9k2m');
const allAuthConfigs = await client.authConfigs.listAll({ server_slug: 'hubspot' });
```

## Connections

| Method | Description |
|--------|-------------|
| `list(params?, options?)` | Fetch a single page |
| `listAll(params?, options?)` | SDK convenience — fetch all pages into an array |
| `initiate(body, options?)` | Initiate a connection and get OAuth redirect URL |
| `getById(id, options?)` | Get one connection by ID |
| `delete(id, options?)` | Revoke and delete a connection |

```typescript
const connection = await client.connections.initiate(
  {
    server_slug: 'hubspot',
    auth_config_id: 'ac_hb7x9k2m',
    name: 'HubSpot - Acme Corp',
    scopes: ['crm.objects.contacts.read'],
  },
  { idempotencyKey: 'connection-hubspot' },
);

console.log(connection.redirect_url);

const page = await client.connections.list({
  page: 1,
  page_size: 20,
  server_slug: 'hubspot',
  status: 'initiated',
});
```

## Gateways

| Method | Description |
|--------|-------------|
| `list(params?, options?)` | List gateways (paginated) |
| `listAll(params?, options?)` | Fetch all gateways across pages |
| `create(body, options?)` | Create a gateway |
| `getById(id, options?)` | Get a gateway by ID |
| `update(id, body, options?)` | Update gateway fields |
| `delete(id, options?)` | Delete a gateway |
| `listServers(gatewayId, params?, options?)` | List servers attached to a gateway |
| `listServersAll(gatewayId, params?, options?)` | Fetch all gateway servers across pages |
| `addServer(gatewayId, body, options?)` | Attach a server to a gateway |
| `removeServer(gatewayId, serverSlug, options?)` | Detach a server from a gateway |
| `listTools(gatewayId, params?, options?)` | List tools exposed through a gateway |
| `listToolsAll(gatewayId, params?, options?)` | Fetch all gateway tools across pages |
| `addTools(gatewayId, body, options?)` | Add tools to a gateway (custom mode) |
| `removeTools(gatewayId, body, options?)` | Remove tools from a gateway (custom mode) |

```typescript
const gateway = await client.gateways.create({
  name: 'CRM Gateway',
  exposure_mode: 'dynamic',
  include_all_servers: false,
});

const servers = await client.gateways.listServers(gateway.id);
await client.gateways.addServer(gateway.id, {
  server_slug: 'hubspot',
  auth_config_id: 'ac_hb7x9k2m',
});

const tools = await client.gateways.listTools(gateway.id, {
  server_slug: 'hubspot',
  search: 'contact',
});
```

## Gateway Instances

| Method | Description |
|--------|-------------|
| `list(gatewayId, params?, options?)` | List instances for a gateway |
| `listAll(gatewayId, params?, options?)` | SDK convenience — fetch all pages |
| `create(gatewayId, body, options?)` | Create a per-user instance |
| `connect(gatewayId, instanceId, options?)` | Get MCP connection URL |
| `listConnections(gatewayId, instanceId, params?, options?)` | List per-server connection status |
| `createConnectionLink(gatewayId, instanceId, body, options?)` | Generate OAuth redirect URL for a server |

```typescript
const instance = await client.gatewayInstances.create('gw_crm2x8fp', {
  user_id: 'usr_acme_sales_42',
  name: 'Acme Corp - Sales Team',
});

const { mcp } = await client.gatewayInstances.connect(
  'gw_crm2x8fp',
  instance.id,
);
console.log(mcp.url);

const connections = await client.gatewayInstances.listConnections(
  'gw_crm2x8fp',
  instance.id,
  { status: 'connected' },
);

const link = await client.gatewayInstances.createConnectionLink(
  'gw_crm2x8fp',
  instance.id,
  { server_slug: 'hubspot', scopes: ['crm.objects.contacts.read'] },
);
console.log(link.redirect_url);
```

## Traces

| Method | Description |
|--------|-------------|
| `list(params?, options?)` | List trace events (paginated) |
| `listAll(params?, options?)` | Fetch all trace events across pages |
| `getById(id, options?)` | Get a single trace event by ID |

```typescript
const page = await client.traces.list({
  gateway_id: 'gw_crm2x8fp',
  instance_id: 'inst_acme42x',
  server_slug: 'hubspot',
  methods: 'tools/call,tools/list',
  from: '2026-06-01',
  to: '2026-06-30',
});

const trace = await client.traces.getById('tr_9xk2mfp');
console.log(trace.duration_ms, trace.rpc_method);
```

## Sessions

| Method | Description |
|--------|-------------|
| `create(body, options?)` | Create or get a session (returns MCP URL and connections) |
| `getById(id, options?)` | Get an existing session by instance ID |

## Errors

```typescript
import {
  SynqedError,
  SynqedAPIError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
} from '@synqedai/typescript';

try {
  await client.sessions.create({
    user_id: 'user_12345',
    gateway: { name: 'CRM Gateway', exposure_mode: 'dynamic' },
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  }

  if (error instanceof RateLimitError) {
    console.error(error.rateLimit);
  }

  if (error instanceof SynqedAPIError) {
    console.error(error.code);
    console.error(error.details);
    console.error(error.requestId);
  }
}
```

API errors follow this shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Request validation failed",
    "details": [{ "field": "name", "reason": "required" }]
  }
}
```

## Public exports

```text
SynqedClient
SynqedError
SynqedAPIError
AuthenticationError
RateLimitError
NetworkError
default (SynqedClient)
```

Types: `SynqedClientConfig`, `RetryConfig`, `ApiResponse`, `PaginationParams`, `PageInfo`, `PaginatedResponse`, `SynqedErrorCode`, `SynqedErrorDetail`, `MCPServer`, `MCPServerDetail`, `MCPTool`, `ListMCPServersParams`, `ListMCPServerToolsParams`, `AuthConfig`, `AuthConfigListItem`, `ListAuthConfigsParams`, `Connection`, `ConnectionStatus`, `InitiateConnectionRequest`, `ListConnectionsParams`, `GatewayInstance`, `CreateGatewayInstanceRequest`, `ListGatewayInstancesParams`, `GatewayInstanceConnectResponse`, `GatewayInstanceConnection`, `ConnectionLink`, `CreateConnectionLinkRequest`, `Session`, `SessionConnection`, `CreateSessionRequest`, `GatewayExposureMode`, `CreateAuthConfigRequest`, `UpdateAuthConfigRequest`.

## Development

```bash
npm install
cp .env.example .env   # optional, for local env vars
npm run build
npm run typecheck
npm run test
```

## License

MIT
