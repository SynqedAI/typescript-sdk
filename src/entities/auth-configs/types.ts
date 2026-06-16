import type { PaginationParams } from '@/core/pagination/types';

export type AuthConfigStatus = 'enabled' | 'disabled';

export type AuthConfigSortBy = 'name' | 'created_at' | 'updated_at';

export type AuthConfigSortOrder = 'asc' | 'desc';

export type AuthMethodType = 'oauth' | 'api_key';

export interface AuthConfigAuthMethod {
  name: string;
  type: string;
}

export interface AuthConfigServer {
  logo_url?: string;
  name: string;
  slug: string;
}

export interface AuthConfigScope {
  description?: string;
  is_required?: boolean;
  scope_key: string;
}

/** Auth config item returned by list endpoints. */
export interface AuthConfigListItem {
  id: string;
  name: string;
  status: string;
  is_default: boolean;
  auth_method: AuthConfigAuthMethod;
  server: AuthConfigServer;
  created_at: string;
  updated_at: string;
}

/** Full auth config returned by create. */
export interface AuthConfig extends AuthConfigListItem {
  scopes?: AuthConfigScope[];
}

export interface AuthConfigOAuthOverride {
  client_id?: string;
  client_secret?: string;
}

/** Request body for creating an auth config. */
export interface CreateAuthConfigRequest {
  auth_method_type: AuthMethodType;
  name: string;
  server_slug: string;
  oauth_override?: AuthConfigOAuthOverride;
  scopes?: string[];
}

/** Request body for updating an auth config. */
export interface UpdateAuthConfigRequest {
  name?: string;
  oauth_override?: AuthConfigOAuthOverride;
}

/** Query parameters for listing auth configs. */
export interface ListAuthConfigsParams extends PaginationParams {
  server_slug?: string;
  status?: AuthConfigStatus;
  sort_by?: AuthConfigSortBy;
  sort_order?: AuthConfigSortOrder;
}
