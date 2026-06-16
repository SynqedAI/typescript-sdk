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

## Create a session

The recommended integration path is `POST /sessions`:

```typescript
const session = await client.sessions.create(
  {
    user_id: 'user_12345',
    gateway: {
      name: 'My App Gateway',
      exposure_mode: 'dynamic',
      include_all_servers: true,
    },
  },
  {
    idempotencyKey: 'session-user-12345',
    requestId: 'req_123',
  },
);

console.log(session.mcp.url);
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

## Sessions

| Method | Description |
|--------|-------------|
| `create(body, options?)` | Create a session with MCP gateway |

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
    gateway: { exposure_mode: 'dynamic' },
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

Types: `SynqedClientConfig`, `RetryConfig`, `ApiResponse`, `PaginationParams`, `PageInfo`, `PaginatedResponse`, `SynqedErrorCode`, `SynqedErrorDetail`, `MCPServer`, `MCPServerDetail`, `MCPTool`, `ListMCPServersParams`, `ListMCPServerToolsParams`, `AuthConfig`, `AuthConfigListItem`, `ListAuthConfigsParams`, `Session`, `SessionConnection`, `CreateSessionRequest`, `GatewayExposureMode`, `CreateAuthConfigRequest`, `UpdateAuthConfigRequest`.

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
