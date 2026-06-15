import type { SDKErrorType } from "./types";

export class BaseError extends Error {
  readonly type: SDKErrorType;
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(params: {
    type: SDKErrorType;
    message: string;
    status?: number;
    code?: string;
    requestId?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = "BaseError";
    this.type = params.type;
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.retryable = params.retryable ?? false;
  }
}
