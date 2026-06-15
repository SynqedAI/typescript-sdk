import {
  SynqedError,
  type SynqedErrorCode,
  type SynqedErrorDetail,
} from '@/core/errors/synqed-error';

export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: string;
}

export class RateLimitError extends SynqedError {
  readonly rateLimit?: RateLimitInfo;

  constructor(
    params: {
      message?: string;
      code?: SynqedErrorCode;
      requestId?: string;
      details?: SynqedErrorDetail[];
      rateLimit?: RateLimitInfo;
    } = {},
  ) {
    super({
      type: 'rate_limit_error',
      message: params.message ?? 'Rate limit exceeded',
      status: 429,
      code: params.code,
      requestId: params.requestId,
      details: params.details,
      retryable: true,
    });
    this.name = 'RateLimitError';
    this.rateLimit = params.rateLimit;
  }
}
