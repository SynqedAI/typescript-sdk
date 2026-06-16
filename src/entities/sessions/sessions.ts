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

  private resolveOptions(options: RequestOptions = {}): RequestOptions {
    return {
      ...options,
      timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
    };
  }

  /**
   * Finds or creates a session for a user.
   * Optionally creates a gateway inline or uses an existing `gateway_id`.
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
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Retrieves an existing session by instance ID.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async getById(id: string, options: RequestOptions = {}): Promise<Session> {
    const response = await this.http.request<ApiResponse<Session>>(
      `/sessions/${encodeURIComponent(id)}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );

    return response.data;
  }
}
