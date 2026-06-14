// Used For

// Server-side API failures:

// 400
// 404
// 500
// etc.


import { BaseError } from './BaseError';

export class APIError extends BaseError {
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

    this.name = 'APIError';
  }
}