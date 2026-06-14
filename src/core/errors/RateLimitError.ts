import { BaseError } from './BaseError';

export class RateLimitError
  extends BaseError {
  constructor(
    message =
      'Rate limit exceeded',
  ) {
    super({
      type: 'rate_limit_error',

      message,

      status: 429,

      retryable: true,
    });

    this.name =
      'RateLimitError';
  }
}