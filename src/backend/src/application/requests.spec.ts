import { DomainError } from '../domain/errors.js';
import {
  parseAvailability,
  parseCartItems,
  parseCreateOrder,
  parseOrderIds,
  parsePaymentMode,
  parseStatus,
} from './requests.js';

describe('request parsing', () => {
  it('reads cart items and drops any extra field', () => {
    expect(
      parseCartItems({ items: [{ productId: 'tarta', quantity: 2, unitPriceCents: 1 }] }),
    ).toEqual([{ productId: 'tarta', quantity: 2 }]);
  });

  it.each([
    undefined,
    null,
    'items',
    {},
    { items: 'tarta' },
    { items: [null] },
    { items: [{ productId: '', quantity: 1 }] },
    { items: [{ productId: 'tarta', quantity: '2' }] },
    { items: [{ productId: 'x'.repeat(65), quantity: 1 }] },
  ])('rejects the malformed cart %j', (body) => {
    expect(() => parseCartItems(body)).toThrow(DomainError);
  });

  it('reads an order with its customer name', () => {
    expect(
      parseCreateOrder({ customerName: 'Martín', items: [{ productId: 'tarta', quantity: 1 }] }),
    ).toEqual({ customerName: 'Martín', items: [{ productId: 'tarta', quantity: 1 }] });
  });

  it('accepts only known statuses', () => {
    expect(parseStatus({ status: 'preparing' })).toBe('preparing');
    expect(() => parseStatus({ status: 'cooking' })).toThrow(DomainError);
    expect(() => parseStatus({})).toThrow(DomainError);
  });

  it('accepts only a boolean availability', () => {
    expect(parseAvailability({ available: false })).toBe(false);
    expect(() => parseAvailability({ available: 'no' })).toThrow(DomainError);
  });

  it('reads a comma-separated list of order ids, without duplicates', () => {
    expect(parseOrderIds('a, b,a,,c')).toEqual(['a', 'b', 'c']);
  });

  it.each([undefined, '', ' , ', ['a', 'b'], 'x'.repeat(65), Array.from({ length: 11 }, (_, i) => `o${i}`).join(',')])(
    'rejects the order id list %j',
    (raw) => {
      expect(() => parseOrderIds(raw)).toThrow(DomainError);
    },
  );

  it('accepts only approve or reject as the next simulated payment', () => {
    expect(parsePaymentMode({ nextResult: 'reject' })).toBe('reject');
    expect(() => parsePaymentMode({ nextResult: 'maybe' })).toThrow(DomainError);
  });
});
