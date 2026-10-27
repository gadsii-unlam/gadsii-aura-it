import { DomainError } from './errors.js';
import { MAX_CUSTOMER_NAME_LENGTH, normalizeCustomerName } from './customer-name.js';

describe('normalizeCustomerName', () => {
  it('trims and collapses inner whitespace', () => {
    expect(normalizeCustomerName('  Martín   Pérez ')).toBe('Martín Pérez');
  });

  it.each(['', '   ', undefined, null, 42])('rejects %p', (raw) => {
    expect(() => normalizeCustomerName(raw)).toThrow(DomainError);
  });

  it('rejects names longer than the limit', () => {
    const tooLong = 'a'.repeat(MAX_CUSTOMER_NAME_LENGTH + 1);
    expect(() => normalizeCustomerName(tooLong)).toThrow(/nombre/i);
  });

  it('accepts a name exactly at the limit', () => {
    const atLimit = 'a'.repeat(MAX_CUSTOMER_NAME_LENGTH);
    expect(normalizeCustomerName(atLimit)).toBe(atLimit);
  });
});
