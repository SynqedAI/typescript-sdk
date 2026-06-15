/** Per-request options passed to {@link HttpClient.request}. */
export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
  requestId?: string;
}
