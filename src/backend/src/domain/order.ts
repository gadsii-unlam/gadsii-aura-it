import type { Order, OrderItem, OrderStatus, PaymentAttempt, PrepEstimate } from '@buffetya/shared';
import { DomainError } from './errors.js';

const MINUTE = 60_000;

/**
 * Status changes the buffet can make by hand. Entering the kitchen
 * (`awaiting_payment → received`) is deliberately missing: only an approved
 * payment does that, see `recordApprovedPayment`.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  awaiting_payment: ['cancelled'],
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STATUS_NAMES: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: 'esperando el pago',
  received: 'recibido',
  preparing: 'en preparación',
  ready: 'listo para retirar',
  delivered: 'entregado',
  cancelled: 'cancelado',
};

export function isAllowedTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface NewOrder {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalCents: number;
  estimate: PrepEstimate;
  createdAt: Date;
}

/** A priced order that is not in the kitchen until its payment is approved. */
export function createOrder(input: NewOrder): Order {
  return {
    id: input.id,
    customerName: input.customerName,
    items: input.items.map((item) => ({ ...item })),
    totalCents: input.totalCents,
    status: 'awaiting_payment',
    paymentMethod: 'mercado_pago',
    paymentStatus: 'pending',
    estimate: { ...input.estimate },
    createdAt: input.createdAt.toISOString(),
  };
}

export function canBePaid(order: Order): boolean {
  return order.status === 'awaiting_payment';
}

/** Throws PAYMENT_NOT_ALLOWED unless the order is waiting for its payment. */
export function assertPayable(order: Order): void {
  if (!canBePaid(order)) {
    throw new DomainError(
      'PAYMENT_NOT_ALLOWED',
      order.paymentStatus === 'approved'
        ? 'Este pedido ya está pagado.'
        : 'Este pedido ya no se puede pagar.',
    );
  }
}

export interface ApprovedPayment {
  attempt: PaymentAttempt;
  pickupCode: string;
  /** Estimate recomputed against the kitchen queue at payment time. */
  estimate: PrepEstimate;
}

/** The payment went through: the order enters the kitchen. */
export function recordApprovedPayment(order: Order, payment: ApprovedPayment): Order {
  assertPayable(order);
  const paidAt = new Date(payment.attempt.at);
  return {
    ...order,
    status: 'received',
    paymentStatus: 'approved',
    pickupCode: payment.pickupCode,
    estimate: { ...payment.estimate },
    lastPaymentAttempt: { ...payment.attempt },
    paidAt: paidAt.toISOString(),
    estimatedReadyAt: new Date(paidAt.getTime() + payment.estimate.maxMinutes * MINUTE).toISOString(),
  };
}

/** The payment was rejected: nothing was charged and the order stays out of the kitchen. */
export function recordRejectedPayment(order: Order, attempt: PaymentAttempt): Order {
  assertPayable(order);
  return {
    ...order,
    paymentStatus: 'rejected',
    lastPaymentAttempt: { ...attempt },
  };
}

export interface StatusChangeSettings {
  /** How long the counter keeps a ready order: "Te esperamos hasta las HH:MM". */
  pickupHoldMinutes: number;
}

/** A status change made by the buffet (backstage in the MVP). */
export function changeStatus(
  order: Order,
  to: OrderStatus,
  at: Date,
  settings: StatusChangeSettings,
): Order {
  if (!isAllowedTransition(order.status, to)) {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Un pedido ${STATUS_NAMES[order.status]} no puede pasar a ${STATUS_NAMES[to]}.`,
    );
  }
  const stamp = at.toISOString();
  switch (to) {
    case 'preparing':
      return { ...order, status: to, preparingAt: stamp };
    case 'ready':
      return {
        ...order,
        status: to,
        readyAt: stamp,
        pickupDeadlineAt: new Date(at.getTime() + settings.pickupHoldMinutes * MINUTE).toISOString(),
      };
    case 'delivered':
      return { ...order, status: to, deliveredAt: stamp };
    case 'cancelled':
      return { ...order, status: to, cancelledAt: stamp };
    default:
      return { ...order, status: to };
  }
}
