import { BaseError } from './BaseError';

export class TimeoutError
  extends BaseError {
  constructor(
    message = 'Request timed out',
  ) {
    super({
      type: 'timeout_error',

      message,

      retryable: true,
    });

    this.name =
      'TimeoutError';
  }
}