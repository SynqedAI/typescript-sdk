export { SynqedClient } from '@/client';
export { SynqedClient as default } from '@/client';

export {
  SynqedError,
  SynqedAPIError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
} from '@/core/errors';

export type {
  SynqedClientConfig,
  RetryConfig,
} from '@/client';

export type {
  ApiResponse,
  PaginationParams,
  PageInfo,
  PaginatedResponse,
} from '@/core/pagination';

export type {
  SynqedErrorCode,
  SynqedErrorDetail,
} from '@/core/errors';

export type {
  MCPServer,
  MCPServerDetail,
  MCPServerAuthMethod,
  MCPServerScope,
  MCPTool,
  ListMCPServersParams,
  ListMCPServerToolsParams,
} from '@/entities/mcp-servers';

export type {
  Session,
  SessionConnection,
  SessionMcpEndpoint,
  CreateSessionGateway,
  CreateSessionRequest,
  GatewayExposureMode,
} from '@/entities/sessions';

export type {
  AuthConfig,
  AuthConfigListItem,
  AuthConfigAuthMethod,
  AuthConfigOAuthOverride,
  AuthConfigScope,
  AuthConfigServer,
  AuthConfigSortBy,
  AuthConfigSortOrder,
  AuthConfigStatus,
  AuthMethodType,
  CreateAuthConfigRequest,
  ListAuthConfigsParams,
  UpdateAuthConfigRequest,
} from '@/entities/auth-configs';

export type {
  Connection,
  ConnectionStatus,
  InitiateConnectionRequest,
  ListConnectionsParams,
} from '@/entities/connections';

export type {
  ConnectionLink,
  CreateConnectionLinkRequest,
  CreateGatewayInstanceRequest,
  GatewayInstance,
  GatewayInstanceConnectResponse,
  GatewayInstanceConnection,
  InstanceConnectionStatus,
  ListGatewayInstanceConnectionsParams,
  ListGatewayInstancesParams,
  MCPEndpoint,
} from '@/entities/gateway-instances';

export type {
  AddGatewayServerRequest,
  AddGatewayToolsRequest,
  AddGatewayToolsResponse,
  CreateGatewayRequest,
  Gateway,
  GatewayServer,
  GatewayServerAuthConfig,
  GatewayServerInput,
  GatewayStatus,
  GatewayTool,
  GatewayToolInput,
  ListGatewayServersParams,
  ListGatewaysParams,
  ListGatewayToolsParams,
  RemoveGatewayToolsRequest,
  RemoveGatewayToolsResponse,
  ToolAnnotationPolicy,
  UpdateGatewayRequest,
} from '@/entities/gateways';

export type { Trace, ListTracesParams } from '@/entities/traces';
