import { SynqedError } from '@/core/errors/synqed-error';

export class AuthenticationError extends SynqedError {
  constructor(message = 'Authentication failed') {
    super({
      type: 'authentication_error',
      message,
      status: 401,
      retryable: false,
    });
    this.name = 'AuthenticationError';
  }
}
