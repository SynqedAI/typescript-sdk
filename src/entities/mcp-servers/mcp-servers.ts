import type { HttpClient } from "../../core/http/httpClient";
import { createPaginator } from "../../core/pagination";
import type { PaginatedResponse } from "../../core/pagination";
import { removeUndefined } from "../../core/utils";
import type {
  MCPServer,
  CreateMCPServerRequest,
  ListMCPServersParams,
} from "./types";


export class MCPServersEntity {
  constructor(private readonly http: HttpClient) {}

  list(params: ListMCPServersParams = {}) {
    const searchParams = new URLSearchParams(
      removeUndefined({
        limit: params.limit?.toString(),
        cursor: params.cursor,
      }) as Record<string, string>,
    );
    const query = searchParams.toString();

    return this.http.request<PaginatedResponse<MCPServer>>(
      `/mcp-servers${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  }

  listAll() {
    return createPaginator((cursor) =>
      this.list({
        cursor,
      }),
    );
  }

  retrieve(id: string) {
    return this.http.request<MCPServer>(`/mcp-servers/${id}`, {
      method: "GET",
    });
  }


  create(body: CreateMCPServerRequest) {
    return this.http.request<MCPServer>("/mcp-servers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }


  delete(id: string) {
    return this.http.request<void>(`/mcp-servers/${id}`, {
      method: "DELETE",
    });
  }
}
