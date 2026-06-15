// src/version.ts
var VERSION = "0.1.0";

// src/core/runtime/user-agent.ts
function createUserAgent() {
  return `synqedai-typescript/${VERSION}`;
}

// src/core/http/headers.ts
function buildHeaders(apiKey, idempotencyKey) {
  return {
    "Content-Type": "application/json",
    "User-Agent": createUserAgent(),
    ...apiKey && {
      Authorization: `Bearer ${apiKey}`
    },
    ...idempotencyKey && {
      "Idempotency-Key": idempotencyKey
    }
  };
}

// src/core/http/response.ts
async function parseResponse(response) {
  if (response.status === 204) {
    return void 0;
  }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// src/core/resilience/sleep.ts
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// src/core/resilience/retry.ts
function calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs) {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

// src/core/resilience/jitter.ts
function addJitter(delay) {
  return Math.random() * delay;
}

// src/core/errors/BaseError.ts
var BaseError = class extends Error {
  constructor(params) {
    super(params.message);
    this.name = "BaseError";
    this.type = params.type;
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.retryable = params.retryable ?? false;
  }
};

// src/core/resilience/should-retry.ts
var RETRYABLE_STATUS_CODES = [
  408,
  // timeout
  429,
  // rate limit
  500,
  502,
  503,
  504
];
var SAFE_HTTP_METHODS = ["GET", "HEAD", "OPTIONS"];
function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}
function isRetryableMethod(method, hasIdempotencyKey) {
  const normalizedMethod = method.toUpperCase();
  if (SAFE_HTTP_METHODS.includes(normalizedMethod)) {
    return true;
  }
  return hasIdempotencyKey;
}
function shouldRetry(error, method = "GET", hasIdempotencyKey = false) {
  if (isAbortError(error)) {
    return false;
  }
  if (error instanceof BaseError) {
    if (!error.retryable) {
      return false;
    }
    if (error.status && !RETRYABLE_STATUS_CODES.includes(error.status)) {
      return false;
    }
    return isRetryableMethod(method, hasIdempotencyKey);
  }
  if (error instanceof TypeError) {
    return isRetryableMethod(method, hasIdempotencyKey);
  }
  return false;
}

// src/core/resilience/execute-with-retry.ts
var DEFAULT_RETRY_CONFIG = {
  retries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5e3
};
async function executeWithRetry(fn, options, config = DEFAULT_RETRY_CONFIG) {
  let lastError;
  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = shouldRetry(
        error,
        options?.method,
        options?.hasIdempotencyKey
      );
      if (!retryable) {
        throw error;
      }
      if (attempt === config.retries) {
        break;
      }
      const delay = addJitter(
        calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs)
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

// src/core/errors/APIError.ts
var APIError = class extends BaseError {
  constructor(params) {
    super({
      type: "api_error",
      ...params
    });
    this.name = "APIError";
  }
};

// src/core/errors/NetworkError.ts
var NetworkError = class extends BaseError {
  constructor(message = "Network request failed") {
    super({
      type: "network_error",
      message,
      retryable: true
    });
    this.name = "NetworkError";
  }
};

// src/core/errors/AuthenticationError.ts
var AuthenticationError = class extends BaseError {
  constructor(message = "Authentication failed") {
    super({
      type: "authentication_error",
      message,
      status: 401,
      retryable: false
    });
    this.name = "AuthenticationError";
  }
};

// src/core/errors/RateLimitError.ts
var RateLimitError = class extends BaseError {
  constructor(message = "Rate limit exceeded") {
    super({
      type: "rate_limit_error",
      message,
      status: 429,
      retryable: true
    });
    this.name = "RateLimitError";
  }
};

// src/core/errors/parse-error.ts
async function parseError(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    body = void 0;
  }
  const message = body?.message ?? `HTTP ${response.status}`;
  const code = body?.code;
  const requestId = response.headers.get(
    "x-request-id"
  ) ?? void 0;
  if (response.status === 401) {
    return new AuthenticationError(
      message
    );
  }
  if (response.status === 429) {
    return new RateLimitError(
      message
    );
  }
  if (response.status >= 400) {
    return new APIError({
      message,
      status: response.status,
      code,
      requestId,
      retryable: response.status >= 500
    });
  }
  return new NetworkError(message);
}

// src/core/middleware/create-debug-middleware.ts
var SENSITIVE_HEADERS = /* @__PURE__ */ new Set([
  "authorization",
  "x-api-key",
  "cookie",
  "set-cookie"
]);
function redactHeaders(headers) {
  const result = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  });
  return result;
}
function createDebugMiddleware() {
  return {
    async onRequest(context) {
      console.debug("[SynqedAI SDK Request]", {
        url: context.url,
        method: context.init.method,
        headers: redactHeaders(context.init.headers),
        body: context.init.body
      });
    },
    async onResponse(response) {
      console.debug("[SynqedAI SDK Response]", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: redactHeaders(response.headers)
      });
    },
    async onError(error) {
      console.error("[SynqedAI SDK Error]", error);
    }
  };
}

// src/core/middleware/run-middleware.ts
async function runOnRequest(middlewares, context) {
  for (const middleware of middlewares) {
    await middleware.onRequest?.(context);
  }
}
async function runOnResponse(middlewares, response) {
  for (const middleware of middlewares) {
    await middleware.onResponse?.(response);
  }
}
async function runOnError(middlewares, error) {
  for (const middleware of middlewares) {
    await middleware.onError?.(error);
  }
}

// src/core/http/httpClient.ts
var HttpClient = class {
  constructor(config) {
    this.config = config;
    this.middlewares = config.debug ? [createDebugMiddleware()] : [];
  }
  async request(path, init = {}, options = {}) {
    const fullUrl = new URL(
      path,
      this.config.baseURL
    ).toString();
    return executeWithRetry(
      async () => {
        const requestInit = {
          ...init,
          signal: options.signal,
          headers: {
            ...buildHeaders(
              this.config.apiKey,
              options.idempotencyKey
            ),
            ...init.headers
          }
        };
        const requestContext = {
          url: fullUrl,
          init: requestInit
        };
        await runOnRequest(this.middlewares, requestContext);
        if (this.config.dryRun) {
          return {
            dryRun: true,
            url: fullUrl,
            init: requestInit
          };
        }
        try {
          const response = await fetch(
            fullUrl,
            requestInit
          );
          if (!response.ok) {
            const error = await parseError(response);
            await runOnError(this.middlewares, error);
            throw error;
          }
          await runOnResponse(this.middlewares, response);
          return parseResponse(response);
        } catch (error) {
          if (!(error instanceof BaseError)) {
            await runOnError(this.middlewares, error);
          }
          throw error;
        }
      },
      {
        method: init.method,
        hasIdempotencyKey: Boolean(
          options.idempotencyKey
        )
      }
    );
  }
};

// src/core/runtime/env.ts
function getEnv(key) {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return void 0;
}

// src/core/pagination/create-paginator.ts
async function* createPaginator(fetchPage) {
  let cursor;
  while (true) {
    const page = await fetchPage(cursor);
    for (const item of page.data) {
      yield item;
    }
    if (!page.pageInfo.hasMore) {
      break;
    }
    cursor = page.pageInfo.nextCursor;
  }
}

// src/core/utils/removeUndefined.ts
function removeUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== void 0)
  );
}

// src/entities/mcp-servers/mcp-servers.ts
var MCPServersEntity = class {
  constructor(http) {
    this.http = http;
  }
  list(params = {}) {
    const searchParams = new URLSearchParams(
      removeUndefined({
        limit: params.limit?.toString(),
        cursor: params.cursor
      })
    );
    const query = searchParams.toString();
    return this.http.request(
      `/mcp-servers${query ? `?${query}` : ""}`,
      {
        method: "GET"
      }
    );
  }
  listAll() {
    return createPaginator(
      (cursor) => this.list({
        cursor
      })
    );
  }
  retrieve(id) {
    return this.http.request(`/mcp-servers/${id}`, {
      method: "GET"
    });
  }
  create(body) {
    return this.http.request("/mcp-servers", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
  delete(id) {
    return this.http.request(`/mcp-servers/${id}`, {
      method: "DELETE"
    });
  }
};

// src/client/synqed-ai-client.ts
var SynqedAIClient = class {
  constructor(config = {}) {
    this.apiKey = config.apiKey ?? getEnv("SYNQEDAI_API_KEY");
    this.baseURL = config.baseURL ?? getEnv("SYNQEDAI_BASE_URL") ?? "https://synqedai.com/api/v1";
    this.timeout = config.timeout ?? 3e4;
    this.debug = config.debug ?? false;
    this.dryRun = config.dryRun ?? false;
    this.http = new HttpClient({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      debug: this.debug,
      dryRun: this.dryRun
    });
    this.mcpServers = new MCPServersEntity(this.http);
  }
};

export { SynqedAIClient };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map