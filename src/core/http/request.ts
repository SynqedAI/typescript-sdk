export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  idempotencyKey?: string;
}
