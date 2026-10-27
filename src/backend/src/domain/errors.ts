import type { ApiErrorCode } from '@buffetya/shared';

/** Error codes the domain and application layers can raise. */
export type DomainErrorCode = Extract<
  ApiErrorCode,
  | 'INVALID_REQUEST'
  | 'UNKNOWN_PRODUCT'
  | 'PRODUCT_UNAVAILABLE'
  | 'ORDER_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'ILLEGAL_TRANSITION'
  | 'PAYMENT_NOT_ALLOWED'
>;

/**
 * A rule of the business was broken. Carries a stable code that the HTTP layer
 * maps to a status, and a Spanish message that is safe to show to a user.
 */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly productIds?: string[],
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export const invalid = (message: string): DomainError => new DomainError('INVALID_REQUEST', message);
