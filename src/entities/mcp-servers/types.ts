export interface MCPServer {
  id: string;
  name: string;
  transport: string;
  createdAt: string;
}

export interface CreateMCPServerRequest {
  name: string;
  transport: string;
}

export interface ListMCPServersParams {
  limit?: number;
  cursor?: string;
}
