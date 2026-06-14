// Why?

// Supports:
// AbortController
// retries
// safe mutations


export interface RequestOptions {
    signal?: AbortSignal;
  
    timeout?: number;
  
    idempotencyKey?: string;
  }