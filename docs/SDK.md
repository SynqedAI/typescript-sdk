# SynqedAI TypeScript SDK — Complete Reference

Official documentation for the `@synqedai/typescript` SDK: packages, architecture, data flow, and every function.

---

## Table of Contents

1. [Overview](#overview)
2. [Packages & Tooling](#packages--tooling)
3. [Project Structure](#project-structure)
4. [Data Flow](#data-flow)
5. [Client Initialization](#client-initialization)
6. [HTTP Request Pipeline](#http-request-pipeline)
7. [Pagination Flow](#pagination-flow)
8. [Error Handling](#error-handling)
9. [Retry Logic](#retry-logic)
10. [Middleware](#middleware)
11. [Function Reference](#function-reference)
12. [Build & Release](#build--release)
13. [Feature Status](#feature-status)
14. [Quick Reference](#quick-reference)

---

## Overview

The SynqedAI TypeScript SDK is a **zero-runtime-dependency** client library. It uses native APIs (`fetch`, `URL`, etc.) and follows the **entity-oriented pattern** used by Stripe, OpenAI, and similar SDKs.

```
User App
   │
   ▼
SynqedClient          ← config, auth, shared HTTP engine
   │
   ├── mcpServers       ← API entity (more entities added over time)
   │       │
   │       ▼
   └── HttpClient       ← fetch, headers, retry, middleware, errors
           │
           ▼
       SynqedAI REST API (https://api.synqed.ai)
```

**Public API today:**

```ts
import { SynqedClient } from '@synqedai/typescript';

const client = new SynqedClient({ apiKey: 'sk_...' });
const servers = await client.mcpServers.list({ limit: 10 });
```

---

## Packages & Tooling

### Runtime dependencies

**None.** The published package has zero `dependencies`. At runtime it uses native Node 18+ / browser APIs.

| Native API | Where used | Purpose |
|------------|------------|---------|
| `fetch` | `HttpClient.request` | HTTP transport |
| `URL` | `HttpClient.request` | Resolve `baseURL` + path |
| `URLSearchParams` | `MCPServersEntity.list` | Build query strings |
| `Headers` | `debug-middleware.ts` | Read/redact headers |
| `AbortSignal` | `RequestOptions.signal` | Cancel requests |
| `process.env` | `getEnv()` | Read config from environment (Node) |
| `setTimeout` | `sleep()` | Delay between retries |
| `JSON.stringify/parse` | Entities, `parseResponse` | Request/response bodies |

### Dev dependencies

| Package | Purpose |
|---------|---------|
| **typescript** | Type-checking, `.d.ts` generation |
| **tsup** | Bundle SDK → ESM + CJS for npm |
| **@types/node** | Node.js type definitions |
| **vitest** | Unit and integration tests |
| **eslint** + **@typescript-eslint/** | Linting (`no-explicit-any`, `import type`) |
| **prettier** | Code formatting |
| **@changesets/cli** + **changesets** | Version bumps, changelogs, npm publish |

### npm scripts

| Script | Command | What it does |
|--------|---------|--------------|
| `build` | `tsup` | Bundle `src/index.ts` → `dist/` (ESM + CJS + types) |
| `dev` | `tsup --watch` | Rebuild on file changes |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `lint` | `eslint .` | Static analysis |
| `format` | `prettier --write .` | Auto-format |
| `test` | `vitest run` | Run tests |
| `test:watch` | `vitest` | Watch mode |
| `changeset` | `changeset` | Create a version bump note |
| `version-packages` | `changeset version` | Apply version bumps |
| `release` | `changeset publish` | Publish to npm |

### Config files

| File | Role |
|------|------|
| `tsup.config.ts` | ESM + CJS build, sourcemaps, treeshake, ES2020 |
| `tsconfig.json` | Strict TS, declarations, `noUncheckedIndexedAccess` |
| `vitest.config.ts` | Node test environment |
| `eslint.config.js` | TypeScript lint rules |
| `.prettierrc` | Formatting preferences |
| `.changeset/config.json` | Release workflow config |
| `package.json` `exports` | Modern import/require map for consumers |

---

## Project Structure

```
src/
├── index.ts                          # Package entry — re-exports client
├── version.ts                        # SDK version string ('0.1.0')
│
├── client/                           # PUBLIC: main client
│   ├── SynqedClient.ts               # SynqedClient class
│   ├── types.ts                      # SynqedClientConfig
│   └── index.ts
│
├── entities/                         # PUBLIC (via client): API endpoints
│   └── mcp-servers/
│       ├── mcp-servers.ts            # MCPServersEntity
│       ├── types.ts                  # MCPServer, request/params types
│       └── index.ts
│
└── core/                             # INTERNAL: infrastructure
    ├── http/                         # fetch, headers, response parsing
    ├── errors/                       # Typed error hierarchy
    ├── resilience/                   # Retry, backoff, jitter
    ├── middleware/                   # Hook types
    ├── pagination/                   # Cursor-based async iteration
    ├── debug/                        # Debug logging middleware
    ├── runtime/                      # Env vars, user-agent
    ├── types/                        # Future callback types
    └── utils/                        # Small helpers
```

**Convention:**

- `client/` + `entities/` = what users call
- `core/` = how requests run (mostly internal)

---

## Data Flow

### High-level

```
User
  │
  ▼
src/index.ts                    export { SynqedClient }
  │
  ▼
SynqedClient                  resolve config, create HttpClient, wire entities
  │
  ▼
MCPServersEntity              build path/body, call http.request<T>()
  │
  ▼
HttpClient.request()            URL resolve → headers → middleware → fetch
  │
  ▼
executeWithRetry()              retry loop with backoff on safe failures
  │
  ├── success → parseResponse() → typed Promise<T>
  └── failure → parseError()   → throw typed Error
```

### Example: `client.mcpServers.list({ limit: 5 })`

| Step | File | Function | Action |
|------|------|----------|--------|
| 1 | `mcp-servers/mcp-servers.ts` | `list()` | Build `/mcp-servers?limit=5` |
| 2 | `utils/removeUndefined.ts` | `removeUndefined()` | Strip undefined query params |
| 3 | `http/httpClient.ts` | `request()` | Resolve full URL with `baseURL` |
| 4 | `resilience/execute-with-retry.ts` | `executeWithRetry()` | Enter retry wrapper |
| 5 | `http/headers.ts` | `buildHeaders()` | Add auth, user-agent, content-type |
| 6 | `runtime/user-agent.ts` | `createUserAgent()` | `synqedai-typescript/0.1.0` |
| 7 | `debug/debug-middleware.ts` | `onRequest()` | Log request (if debug enabled) |
| 8 | `http/httpClient.ts` | `fetch()` | HTTP GET to API |
| 9 | `debug/debug-middleware.ts` | `onResponse()` | Log response status |
| 10 | `http/response.ts` | `parseResponse()` | Parse JSON → `PaginatedResponse<MCPServer>` |
| 11 | — | — | Return typed data to user |

---

## Client Initialization

```ts
const client = new SynqedClient({
  apiKey: 'sk_...',       // or SYNQEDAI_API_KEY env var
  baseURL: 'https://...',  // or SYNQEDAI_BASE_URL env var
  timeout: 30_000,         // default: 30 seconds
  debug: false,            // enables request/response logging
  dryRun: false,           // skip network, return request preview
  middlewares: [],          // custom hooks
});
```

**Constructor flow:**

1. `getEnv('SYNQEDAI_API_KEY')` — fallback for `apiKey`
2. `getEnv('SYNQEDAI_BASE_URL')` — reads from `.env` or process env (see `.env.example`)
3. Merge user middleware + auto-attach `createDebugMiddleware()` if `debug: true`
4. `new HttpClient({ apiKey, baseURL, timeout, dryRun, middlewares })`
5. `new MCPServersEntity(http)` → exposed as `client.mcpServers`

**`SynqedClient` properties:**

| Property | Type | Source | Purpose |
|----------|------|--------|---------|
| `apiKey` | `string?` | config / env | Bearer token |
| `baseURL` | `string` | config / env / default | API root URL |
| `timeout` | `number` | config (default 30000) | Request timeout (ms) |
| `debug` | `boolean` | config | Debug logging |
| `dryRun` | `boolean` | config | Skip real HTTP calls |
| `http` | `HttpClient` | internal | Shared HTTP engine |
| `mcpServers` | `MCPServersEntity` | internal | MCP Servers API |

---

## HTTP Request Pipeline

`HttpClient.request<T>(path, init, options)` is the single entry point for all API calls.

```
request(path, init, options)
│
├── 1. Resolve URL
│      new URL(path, baseURL) → "https://api.synqed.ai/mcp-servers"
│
├── 2. Wrap in executeWithRetry()
│      │
│      ├── 3. Build request
│      │      buildHeaders(apiKey, idempotencyKey)
│      │      merge with init.headers
│      │
│      ├── 4. Middleware: onRequest (each, in order)
│      │
│      ├── 5. dryRun check
│      │      if true → return { dryRun, url, init } (no network)
│      │
│      ├── 6. fetch(fullUrl, requestInit)
│      │
│      ├── 7. Middleware: onResponse (each, in order)
│      │
│      ├── 8. Check response.ok
│      │      false → parseError(response) → throw typed error
│      │
│      └── 9. parseResponse<T>(response) → return data
│
└── On error: middleware onError → shouldRetry? → backoff → retry or rethrow
```

### Headers (`buildHeaders`)

Every request automatically includes:

| Header | Value | When |
|--------|-------|------|
| `Content-Type` | `application/json` | Always |
| `User-Agent` | `synqedai-typescript/0.1.0` | Always |
| `Authorization` | `Bearer {apiKey}` | When apiKey is set |
| `Idempotency-Key` | `{key}` | When idempotencyKey option is set |

### Response parsing (`parseResponse`)

| Status / Content-Type | Returns |
|-----------------------|---------|
| `204 No Content` | `undefined` |
| `application/json` | Parsed JSON object |
| Other | Response text |

---

## Pagination Flow

```ts
for await (const server of client.mcpServers.listAll()) {
  console.log(server.name);
}
```

```
listAll()
  └── createPaginator((cursor) => list({ cursor }))
        │
        loop:
          ├── list({ cursor })           → fetch one page
          ├── yield each item in data[]  → stream to caller
          ├── check pageInfo.hasMore
          └── cursor = pageInfo.nextCursor → next iteration
```

**Types:**

```ts
interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasMore: boolean;
    nextCursor?: string;
  };
}
```

---

## Error Handling

All API errors are normalized into typed classes extending `BaseError`.

### Decision tree (`parseError`)

```
response.status === 401  →  AuthenticationError  (retryable: false)
response.status === 429  →  RateLimitError        (retryable: true)
response.status >= 400   →  APIError              (retryable: true if status >= 500)
else                     →  NetworkError           (retryable: true)
```

### Error classes

| Class | `type` | When | Key properties |
|-------|--------|------|----------------|
| `BaseError` | — | Base class | `status`, `code`, `requestId`, `retryable` |
| `APIError` | `api_error` | HTTP 4xx/5xx (not 401/429) | `status`, `code`, `requestId` |
| `AuthenticationError` | `authentication_error` | HTTP 401 | `status: 401` |
| `RateLimitError` | `rate_limit_error` | HTTP 429 | `status: 429` |
| `NetworkError` | `network_error` | Connection/DNS failures | — |
| `ValidationError` | `validation_error` | Client-side input errors | Not wired yet |
| `TimeoutError` | `timeout_error` | Request timeout | Not wired yet |

### Usage

```ts
try {
  await client.mcpServers.create({ name: 'x', transport: 'stdio' });
} catch (err) {
  if (err instanceof RateLimitError) {
    // wait and retry manually
  }
  if (err instanceof APIError && err.status === 404) {
    // not found
  }
}
```

---

## Retry Logic

Wrapped by `executeWithRetry()` — runs the request function up to **4 attempts** (initial + 3 retries).

### Default config

```ts
{ retries: 3, baseDelayMs: 500, maxDelayMs: 5000 }
```

### When retries happen (`shouldRetry`)

| Condition | Retries? |
|-----------|----------|
| `AbortError` | Never |
| GET / HEAD / OPTIONS + retryable status | Yes |
| POST / PATCH / DELETE + retryable status + no idempotency key | No |
| POST / PATCH / DELETE + retryable status + idempotency key | Yes |
| 401, 404, validation errors | No |
| Network `TypeError` on safe method | Yes |

**Retryable status codes:** 408, 429, 500, 502, 503, 504

### Backoff timeline (example: 503 on GET)

```
Attempt 0 → fail → wait ~250ms   (500 × 2⁰ + jitter)
Attempt 1 → fail → wait ~500ms   (500 × 2¹ + jitter)
Attempt 2 → fail → wait ~1000ms  (500 × 2² + jitter)
Attempt 3 → fail → throw last error
```

### Functions

| Function | File | Purpose |
|----------|------|---------|
| `executeWithRetry<T>()` | `resilience/execute-with-retry.ts` | Retry loop |
| `shouldRetry()` | `resilience/should-retry.ts` | Retry decision |
| `calculateBackoffDelay()` | `resilience/retry.ts` | `min(base × 2^attempt, max)` |
| `addJitter()` | `resilience/jitter.ts` | Randomize delay (thundering herd prevention) |
| `sleep()` | `resilience/sleep.ts` | `setTimeout` promise wrapper |

---

## Middleware

Hooks that run before/after requests without changing SDK internals.

### Interface

```ts
interface Middleware {
  onRequest?(context: { url: string; init: RequestInit }): void | Promise<void>;
  onResponse?(response: Response): void | Promise<void>;
  onError?(error: unknown): void | Promise<void>;
}
```

### Execution order

```
onRequest  (all middleware, in order)
  → fetch
  → onResponse (all middleware, in order)   [success]
  → onError    (all middleware, in order)   [failure]
```

### Built-in debug middleware

Auto-attached when `debug: true`. Logs requests, responses, and errors. Redacts sensitive headers (`authorization`, `x-api-key`, `cookie`).

Custom middleware can be passed via `SynqedClientConfig.middlewares` for logging, tracing, metrics, etc.

---

## Function Reference

### Public exports

| Export | File | Type |
|--------|------|------|
| `SynqedClient` | `client/SynqedClient.ts` | Class |
| `SynqedClientConfig` | `client/types.ts` | Interface |

### `MCPServersEntity` methods

| Method | HTTP | Path | Returns |
|--------|------|------|---------|
| `list(params?)` | GET | `/mcp-servers` | `Promise<PaginatedResponse<MCPServer>>` |
| `listAll()` | GET (paginated) | `/mcp-servers` | `AsyncGenerator<MCPServer>` |
| `retrieve(id)` | GET | `/mcp-servers/{id}` | `Promise<MCPServer>` |
| `create(body)` | POST | `/mcp-servers` | `Promise<MCPServer>` |
| `delete(id)` | DELETE | `/mcp-servers/{id}` | `Promise<void>` |

### Entity types

```ts
interface MCPServer {
  id: string;
  name: string;
  transport: string;
  createdAt: string;
}

interface CreateMCPServerRequest {
  name: string;
  transport: string;
}

interface ListMCPServersParams {
  limit?: number;
  cursor?: string;
}
```

### HTTP layer

| Function | File | Purpose |
|----------|------|---------|
| `HttpClient` | `http/httpClient.ts` | Central HTTP engine |
| `HttpClient.request<T>()` | `http/httpClient.ts` | Full request pipeline |
| `buildHeaders()` | `http/headers.ts` | Auth, content-type, user-agent |
| `parseResponse<T>()` | `http/response.ts` | Parse success responses |
| `RequestOptions` | `http/request.ts` | `signal`, `timeout`, `idempotencyKey` |

### Error layer

| Function | File | Purpose |
|----------|------|---------|
| `parseError()` | `errors/parse-error.ts` | Map Response → typed Error |
| `BaseError` | `errors/BaseError.ts` | Base error with `status`, `code`, `retryable` |
| `APIError` | `errors/APIError.ts` | Generic HTTP errors |
| `AuthenticationError` | `errors/AuthenticationError.ts` | 401 errors |
| `RateLimitError` | `errors/RateLimitError.ts` | 429 errors |
| `NetworkError` | `errors/NetworkError.ts` | Connection failures |

### Pagination

| Function | File | Purpose |
|----------|------|---------|
| `createPaginator<T>()` | `pagination/create-paginator.ts` | Async generator over pages |

### Runtime

| Function | File | Purpose |
|----------|------|---------|
| `getEnv(key)` | `runtime/env.ts` | Safe `process.env` read |
| `createUserAgent()` | `runtime/user-agent.ts` | User-Agent header value |
| `VERSION` | `version.ts` | SDK version string |

### Utils

| Function | File | Purpose |
|----------|------|---------|
| `removeUndefined(obj)` | `utils/removeUndefined.ts` | Strip undefined keys from objects |

---

## Build & Release

### Build pipeline

```
src/*.ts  →  npm run build (tsup)  →  dist/
                                         ├── index.js    (ESM)
                                         ├── index.cjs   (CommonJS)
                                         └── index.d.ts  (TypeScript types)
```

### Consumer usage

```ts
// ESM (Node 18+, Vite, Next.js, etc.)
import { SynqedClient } from '@synqedai/typescript';

// CommonJS (older Node)
const { SynqedClient } = require('@synqedai/typescript');
```

### Release pipeline

```
1. npm run changeset     → create version bump note
2. npm run version-packages → bump package.json version
3. npm run release       → publish to npm
```

See [versioning.md](./versioning.md) for the full versioning policy.

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| API key auth | ✅ Wired | `Authorization: Bearer` header |
| Base URL | ✅ Wired | Config + env + default |
| Retry + backoff | ✅ Wired | 3 retries, exponential + jitter |
| Typed errors | ✅ Wired | 401, 429, 4xx/5xx mapped |
| Middleware | ✅ Wired | Custom + auto debug |
| Pagination | ✅ Wired | `listAll()` async iterator |
| dryRun | ✅ Wired | Returns request preview |
| Debug logging | ✅ Wired | Redacts sensitive headers |
| User-Agent | ✅ Wired | `synqedai-typescript/{version}` |
| Idempotency key | ⚠️ Partial | Header support exists; entities don't expose it |
| Request timeout | ❌ Not wired | Config exists; not applied to fetch |
| AbortSignal | ⚠️ Partial | Type exists; entities don't pass options |
| ValidationError | ❌ Not wired | Class exists; no client-side validation |
| TimeoutError | ❌ Not wired | Class exists; timeout not implemented |
| Error exports | ❌ Not exported | Users can't import errors from package root |
| Tests | ❌ Placeholder | No real test coverage yet |

---

## Quick Reference

```
USER CODE
    │
    ▼
SynqedClient
    │
    ├── http: HttpClient
    │       └── request(path, init, options)
    │               ├── executeWithRetry()
    │               │       ├── buildHeaders() → createUserAgent()
    │               │       ├── middleware.onRequest()
    │               │       ├── fetch()  OR  dryRun return
    │               │       ├── middleware.onResponse()
    │               │       ├── parseError()  (on failure)
    │               │       ├── parseResponse() (on success)
    │               │       ├── middleware.onError()
    │               │       └── shouldRetry() → backoff → sleep() → retry
    │               └── return Promise<T>
    │
    └── mcpServers: MCPServersEntity
            ├── list()      → removeUndefined → http.request
            ├── listAll()   → createPaginator → list (loop)
            ├── retrieve()  → http.request
            ├── create()    → JSON.stringify → http.request
            └── delete()    → http.request
```

### Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SYNQEDAI_API_KEY` | API authentication | — |
| `SYNQEDAI_BASE_URL` | API base URL | Set in `.env` (see `.env.example`) |

### Adding a new entity

1. Create `src/entities/{name}/` with `types.ts`, `{name}.ts`, `index.ts`
2. Add `readonly {name}: {Name}Entity` to `SynqedClient`
3. Instantiate in constructor: `new {Name}Entity(this.http)`
