import {
  SynqedError,
  type SynqedErrorCode,
  type SynqedErrorDetail,
} from '@/core/errors/synqed-error';

export class AuthenticationError extends SynqedError {
  constructor(
    params: {
      message?: string;
      code?: SynqedErrorCode;
      requestId?: string;
      details?: SynqedErrorDetail[];
    } = {},
  ) {
    super({
      type: 'authentication_error',
      message: params.message ?? 'Authentication failed',
      status: 401,
      code: params.code,
      requestId: params.requestId,
      details: params.details,
      retryable: false,
    });
    this.name = 'AuthenticationError';
  }
}
