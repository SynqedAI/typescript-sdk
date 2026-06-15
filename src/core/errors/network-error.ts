import {
  SynqedError,
  type SynqedErrorCode,
  type SynqedErrorDetail,
} from '@/core/errors/synqed-error';

export class NetworkError extends SynqedError {
  constructor(
    params: {
      message?: string;
      code?: SynqedErrorCode;
      requestId?: string;
      details?: SynqedErrorDetail[];
      retryable?: boolean;
    } = {},
  ) {
    super({
      type: 'network_error',
      message: params.message ?? 'Network request failed',
      code: params.code,
      requestId: params.requestId,
      details: params.details,
      retryable: params.retryable ?? true,
    });
    this.name = 'NetworkError';
  }
}
