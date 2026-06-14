// Used For

// Bad SDK input:

// client.chat.create({
//   model: '',
// });


import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  constructor(message: string) {
    super({
      type: 'validation_error',

      message,

      retryable: false,
    });

    this.name =
      'ValidationError';
  }
}