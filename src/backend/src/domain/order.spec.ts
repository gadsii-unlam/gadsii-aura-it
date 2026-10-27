import type { Order, OrderStatus, PaymentAttempt } from '@buffetya/shared';
import { DomainError } from './errors.js';
import {
  changeStatus,
  createOrder,
  isAllowedTransition,
  recordApprovedPayment,
  recordRejectedPayment,
} from './order.js';

const CREATED_AT = new Date('2026-10-25T21:24:00Z');
const PAID_AT = new Date('2026-10-25T21:24:30Z');

function newOrder(): Order {
  return createOrder({
    id: 'order-1',
    customerName: 'Martín',
    items: [
      {
        productId: 'milanesa',
        name: 'Milanesa napolitana con papas',
        quantity: 1,
        unitPriceCents: 480_000,
        lineTotalCents: 480_000,
      },
    ],
    totalCents: 480_000,
    estimate: { minMinutes: 12, maxMinutes: 15 },
    createdAt: CREATED_AT,
  });
}

const attempt = (result: PaymentAttempt['result'], at = PAID_AT): PaymentAttempt => ({
  result,
  method: 'mercado_pago',
  at: at.toISOString(),
  reference: 'SIM-1',
});

function paidOrder(): Order {
  return recordApprovedPayment(newOrder(), {
    attempt: attempt('approved'),
    pickupCode: 'B-047',
    estimate: { minMinutes: 14, maxMinutes: 17 },
  });
}

const HOLD = { pickupHoldMinutes: 15 };

function errorOf(fn: () => unknown): DomainError {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainError) return error;
    throw error;
  }
  throw new Error('expected a DomainError');
}

describe('a new order', () => {
  it('waits for payment and is not in the kitchen yet', () => {
    const order = newOrder();
    expect(order.status).toBe('awaiting_payment');
    expect(order.paymentStatus).toBe('pending');
    expect(order.paymentMethod).toBe('mercado_pago');
    expect(order.pickupCode).toBeUndefined();
    expect(order.createdAt).toBe(CREATED_AT.toISOString());
  });
});

describe('payment', () => {
  it('an approved payment sends the order to the kitchen with its pickup code', () => {
    const order = paidOrder();
    expect(order.status).toBe('received');
    expect(order.paymentStatus).toBe('approved');
    expect(order.pickupCode).toBe('B-047');
    expect(order.paidAt).toBe(PAID_AT.toISOString());
    expect(order.lastPaymentAttempt?.result).toBe('approved');
  });

  it('an approved payment refreshes the estimate and sets the expected ready time', () => {
    const order = paidOrder();
    expect(order.estimate).toEqual({ minMinutes: 14, maxMinutes: 17 });
    expect(order.estimatedReadyAt).toBe(new Date(PAID_AT.getTime() + 17 * 60_000).toISOString());
  });

  it('a rejected payment leaves the order unpaid and out of the kitchen', () => {
    const order = recordRejectedPayment(newOrder(), attempt('rejected'));
    expect(order.status).toBe('awaiting_payment');
    expect(order.paymentStatus).toBe('rejected');
    expect(order.pickupCode).toBeUndefined();
    expect(order.paidAt).toBeUndefined();
    expect(order.lastPaymentAttempt?.result).toBe('rejected');
  });

  it('can be retried after a rejection', () => {
    const rejected = recordRejectedPayment(newOrder(), attempt('rejected'));
    const approved = recordApprovedPayment(rejected, {
      attempt: attempt('approved'),
      pickupCode: 'B-001',
      estimate: { minMinutes: 12, maxMinutes: 15 },
    });
    expect(approved.status).toBe('received');
    expect(approved.paymentStatus).toBe('approved');
  });

  it('cannot be charged twice', () => {
    const order = paidOrder();
    const error = errorOf(() =>
      recordApprovedPayment(order, {
        attempt: attempt('approved'),
        pickupCode: 'B-048',
        estimate: { minMinutes: 12, maxMinutes: 15 },
      }),
    );
    expect(error.code).toBe('PAYMENT_NOT_ALLOWED');
    expect(errorOf(() => recordRejectedPayment(order, attempt('rejected'))).code).toBe(
      'PAYMENT_NOT_ALLOWED',
    );
  });

  it('does not mutate the original order', () => {
    const original = newOrder();
    recordApprovedPayment(original, {
      attempt: attempt('approved'),
      pickupCode: 'B-047',
      estimate: { minMinutes: 12, maxMinutes: 15 },
    });
    expect(original.status).toBe('awaiting_payment');
  });
});

describe('kitchen flow', () => {
  it('walks received → preparing → ready → delivered, stamping each step', () => {
    const t1 = new Date('2026-10-25T21:26:00Z');
    const t2 = new Date('2026-10-25T21:31:00Z');
    const t3 = new Date('2026-10-25T21:33:00Z');

    const preparing = changeStatus(paidOrder(), 'preparing', t1, HOLD);
    expect(preparing.status).toBe('preparing');
    expect(preparing.preparingAt).toBe(t1.toISOString());

    const ready = changeStatus(preparing, 'ready', t2, HOLD);
    expect(ready.status).toBe('ready');
    expect(ready.readyAt).toBe(t2.toISOString());
    expect(ready.pickupDeadlineAt).toBe(new Date(t2.getTime() + 15 * 60_000).toISOString());

    const delivered = changeStatus(ready, 'delivered', t3, HOLD);
    expect(delivered.status).toBe('delivered');
    expect(delivered.deliveredAt).toBe(t3.toISOString());
  });

  it.each<[OrderStatus, OrderStatus]>([
    ['awaiting_payment', 'received'],
    ['awaiting_payment', 'preparing'],
    ['awaiting_payment', 'ready'],
    ['received', 'ready'],
    ['received', 'delivered'],
    ['preparing', 'received'],
    ['ready', 'preparing'],
    ['delivered', 'cancelled'],
    ['cancelled', 'received'],
    ['delivered', 'delivered'],
  ])('refuses %s → %s', (from, to) => {
    expect(isAllowedTransition(from, to)).toBe(false);
  });

  it('only a payment can move an order into the kitchen', () => {
    const error = errorOf(() => changeStatus(newOrder(), 'received', PAID_AT, HOLD));
    expect(error.code).toBe('ILLEGAL_TRANSITION');
  });

  it('refuses to skip a step', () => {
    const error = errorOf(() => changeStatus(paidOrder(), 'ready', PAID_AT, HOLD));
    expect(error.code).toBe('ILLEGAL_TRANSITION');
  });

  it.each<OrderStatus>(['awaiting_payment', 'received', 'preparing', 'ready'])(
    'allows cancelling from %s',
    (from) => {
      expect(isAllowedTransition(from, 'cancelled')).toBe(true);
    },
  );

  it('stamps the cancellation time', () => {
    const at = new Date('2026-10-25T21:40:00Z');
    const cancelled = changeStatus(paidOrder(), 'cancelled', at, HOLD);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBe(at.toISOString());
  });
});
