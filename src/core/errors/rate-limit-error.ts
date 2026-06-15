import { SynqedError } from '@/core/errors/synqed-error';

export class RateLimitError extends SynqedError {
  constructor(message = 'Rate limit exceeded') {
    super({
      type: 'rate_limit_error',
      message,
      status: 429,
      retryable: true,
    });
    this.name = 'RateLimitError';
  }
}
