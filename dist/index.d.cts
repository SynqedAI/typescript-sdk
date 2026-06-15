interface RequestOptions {
    signal?: AbortSignal;
    timeout?: number;
    idempotencyKey?: string;
}

declare class HttpClient {
    private readonly config;
    private readonly middlewares;
    constructor(config: {
        apiKey?: string;
        baseURL: string;
        timeout?: number;
        debug?: boolean;
        dryRun?: boolean;
    });
    request<T>(path: string, init?: RequestInit, options?: RequestOptions): Promise<T>;
}

interface PageInfo {
    hasMore: boolean;
    nextCursor?: string;
}
interface PaginatedResponse<T> {
    data: T[];
    pageInfo: PageInfo;
}

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

declare class MCPServersEntity {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListMCPServersParams): Promise<PaginatedResponse<MCPServer>>;
    listAll(): AsyncGenerator<MCPServer, void, unknown>;
    retrieve(id: string): Promise<MCPServer>;
    create(body: CreateMCPServerRequest): Promise<MCPServer>;
    delete(id: string): Promise<void>;
}

interface SynqedAIClientConfig {
    apiKey?: string;
    baseURL?: string;
    timeout?: number;
    debug?: boolean;
    dryRun?: boolean;
}

declare class SynqedAIClient {
    readonly apiKey?: string;
    readonly baseURL: string;
    readonly timeout: number;
    readonly debug: boolean;
    readonly dryRun: boolean;
    readonly http: HttpClient;
    readonly mcpServers: MCPServersEntity;
    constructor(config?: SynqedAIClientConfig);
}

export { SynqedAIClient, type SynqedAIClientConfig };
