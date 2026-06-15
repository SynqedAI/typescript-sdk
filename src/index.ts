export {
  SynqedClient,
  SynqedClient as default,
  type SynqedClientConfig,
  type RetryConfig,
} from '@/client';

export type {
  MCPServer,
  CreateMCPServerRequest,
  ListMCPServersParams,
  IterateMCPServersParams,
} from '@/entities/mcp-servers';

export type {
  PaginationParams,
  PageInfo,
  PaginatedResponse,
} from '@/core/pagination/types';

export {
  SynqedError,
  SynqedAPIError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
} from '@/core/errors';
