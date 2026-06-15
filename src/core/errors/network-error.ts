import { SynqedError } from '@/core/errors/synqed-error';

export class NetworkError extends SynqedError {
  constructor(message = 'Network request failed') {
    super({
      type: 'network_error',
      message,
      retryable: true,
    });
    this.name = 'NetworkError';
  }
}
