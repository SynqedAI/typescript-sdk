import {
  SynqedError,
  type SynqedErrorCode,
  type SynqedErrorDetail,
} from '@/core/errors/synqed-error';

export class SynqedAPIError extends SynqedError {
  constructor(params: {
    message: string;
    status: number;
    code?: SynqedErrorCode;
    requestId?: string;
    retryable?: boolean;
    details?: SynqedErrorDetail[];
  }) {
    super({
      type: 'api_error',
      ...params,
    });
    this.name = 'SynqedAPIError';
  }
}
