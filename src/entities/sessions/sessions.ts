import type { RequestOptions } from '@/core/http/request';
import { HttpClient } from '@/core/http/http-client';
import type { ApiResponse } from '@/core/pagination/types';
import type {
  CreateSessionRequest,
  Session,
} from '@/entities/sessions/types';

/** @internal */
export class SessionsEntity {
  constructor(
    private readonly http: HttpClient,
    private readonly defaultTimeoutMs: number,
  ) {}

  /**
   * Creates a new session with an MCP gateway.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async create(
    body: CreateSessionRequest,
    options: RequestOptions = {},
  ): Promise<Session> {
    const response = await this.http.request<ApiResponse<Session>>(
      '/sessions',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      {
        ...options,
        timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
      },
    );

    return response.data;
  }
}
