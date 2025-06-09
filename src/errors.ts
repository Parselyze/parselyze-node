import { ApiError } from './types.js';

export class ParselyzeError extends Error {
  public readonly status?: number;
  public readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ParselyzeError';
    this.status = status;
    this.code = code;
  }

  static fromApiError(error: ApiError): ParselyzeError {
    return new ParselyzeError(error.message, error.status, error.code);
  }
}
