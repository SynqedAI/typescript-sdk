export type SynqedErrorCode =
  | 'validation_failed'
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'quota_exceeded'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal_error'
  | string;

export interface SynqedErrorDetail {
  field: string;
  reason: string;
}

export type SynqedErrorType =
  | 'api_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'network_error';

export class SynqedError extends Error {
  readonly type: SynqedErrorType;
  readonly status?: number;
  readonly code?: SynqedErrorCode;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly details?: SynqedErrorDetail[];

  constructor(params: {
    type: SynqedErrorType;
    message: string;
    status?: number;
    code?: SynqedErrorCode;
    requestId?: string;
    retryable?: boolean;
    details?: SynqedErrorDetail[];
  }) {
    super(params.message);
    this.name = 'SynqedError';
    this.type = params.type;
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.retryable = params.retryable ?? false;
    this.details = params.details;
  }
}
