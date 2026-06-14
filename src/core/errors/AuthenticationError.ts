import { BaseError } from './BaseError';

export class AuthenticationError extends BaseError {
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