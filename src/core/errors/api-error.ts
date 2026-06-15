import { SynqedError } from '@/core/errors/synqed-error';

export class SynqedAPIError extends SynqedError {
  constructor(params: {
    message: string;
    status: number;
    code?: string;
    requestId?: string;
    retryable?: boolean;
  }) {
    super({
      type: 'api_error',
      ...params,
    });
    this.name = 'SynqedAPIError';
  }
}
