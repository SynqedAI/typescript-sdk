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
export SYNQEDAI_BASE_URL=https://api.synqed.ai
```

```typescript
import { SynqedClient } from '@synqedai/typescript';

const client = new SynqedClient({
  apiKey: process.env.SYNQEDAI_API_KEY,
  debug: true,
});

// Single page
const page = await client.mcpServers.list({
  page: 1,
  page_size: 25,
});

console.log(page.data);
console.log(page.total_records);

// Stream all pages
for await (const server of client.mcpServers.iterate()) {
  console.log(server.name);
}

// Fetch all into memory
const allServers = await client.mcpServers.listAll();
```

### CommonJS

```javascript
const { SynqedClient } = require('@synqedai/typescript');
```

## Configuration

```typescript
interface SynqedClientConfig {
  apiKey?: string;       // or SYNQEDAI_API_KEY
  baseUrl?: string;      // or SYNQEDAI_BASE_URL (default: https://api.synqed.ai)
  timeoutMs?: number;    // default: 30000
  debug?: boolean;       // log requests/responses to console
  retries?: RetryConfig | false;  // default: retry enabled
}
```

Config priority: **constructor options → environment variables → defaults**.

## MCP Servers

| Method | Description |
|--------|-------------|
| `list(params?)` | Fetch a single page |
| `iterate(params?)` | Async generator over all pages |
| `listAll(params?)` | Fetch all records into an array |
| `retrieve(id)` | Get one MCP server |
| `create(body, options?)` | Create an MCP server |
| `delete(id, options?)` | Delete an MCP server |

### Pagination response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  next_page: number | null;
  page_size: number;
  prev_page: number | null;
  total_pages: number;
  total_records: number;
}
```

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
  await client.mcpServers.list();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 401 — invalid API key
  } else if (error instanceof RateLimitError) {
    // 429 — rate limited
  } else if (error instanceof SynqedAPIError) {
    // API error with status, code, requestId
  } else if (error instanceof NetworkError) {
    // Network failure
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

Types: `SynqedClientConfig`, `RetryConfig`, `MCPServer`, `CreateMCPServerRequest`, `ListMCPServersParams`, `IterateMCPServersParams`, `PaginationParams`, `PageInfo`, `PaginatedResponse`.

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
