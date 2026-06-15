import { BaseError } from './BaseError';
export class NetworkError extends BaseError {
  constructor(
    message = 'Network request failed',
  ) {
    super({
      type: 'network_error',
      message,
      retryable: true,
    });
    this.name =
      'NetworkError';
  }
}