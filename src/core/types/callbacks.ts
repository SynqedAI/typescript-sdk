export interface ProgressCallback {
  (progress: { loaded: number; total?: number }): void;
}

export interface PollingCallback<T> {
  (value: T): void;
}
