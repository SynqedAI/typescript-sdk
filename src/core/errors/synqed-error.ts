export type SynqedErrorType =
  | 'api_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'network_error';

  export class SynqedError extends Error {
  readonly type: SynqedErrorType;
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(params: {
    type: SynqedErrorType;
    message: string;
    status?: number;
    code?: string;
    requestId?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = 'SynqedError';
    this.type = params.type;
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.retryable = params.retryable ?? false;
  }
}
