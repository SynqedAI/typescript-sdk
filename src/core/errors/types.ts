export type SDKErrorType =
  | 'api_error'
  | 'network_error'
  | 'validation_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'timeout_error';