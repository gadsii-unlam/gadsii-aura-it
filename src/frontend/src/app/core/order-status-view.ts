import type { Order, OrderStatus } from '@buffetya/shared';
import { formatClock, formatReadyIn, minutesUntil } from './format';

/** One vocabulary for the state of an order, shared by 05, 06 and "Mis pedidos". */
export const STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: 'Esperando el pago',
  received: 'Pedido recibido',
  preparing: 'Lo están preparando',
  ready: 'Listo para retirar',
  delivered: 'Pedido entregado',
  cancelled: 'Pedido cancelado',
};

export const STATUS_ICON: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: 'clock',
  received: 'check',
  preparing: 'flame',
  ready: 'checkBig',
  delivered: 'package',
  cancelled: 'x',
};

export interface StatusView {
  status: OrderStatus;
  icon: string;
  title: string;
  /** The line under the title: time left, pickup time or what to do. */
  detail: string;
  showCode: boolean;
}

export function statusView(order: Order, now: Date): StatusView {
  const base = { status: order.status, icon: STATUS_ICON[order.status], title: STATUS_LABEL[order.status] };
  const readyIn = order.estimatedReadyAt ? formatReadyIn(minutesUntil(order.estimatedReadyAt, now)) : '';
  switch (order.status) {
    case 'delivered':
      return {
        ...base,
        detail: order.deliveredAt ? `Retirado ${formatClock(order.deliveredAt)}` : '',
        showCode: false,
      };
    case 'cancelled':
      return { ...base, detail: 'Consultá en el mostrador.', showCode: false };
    case 'ready':
      return {
        ...base,
        detail: order.pickupDeadlineAt ? `Te esperamos hasta las ${formatClock(order.pickupDeadlineAt)}.` : '',
        showCode: true,
      };
    default:
      return { ...base, detail: readyIn, showCode: true };
  }
}

/** Order of the "Mis pedidos" list: what needs the customer first. */
export const LIST_PRIORITY: Readonly<Record<OrderStatus, number>> = {
  ready: 0,
  cancelled: 1,
  preparing: 2,
  received: 3,
  awaiting_payment: 4,
  delivered: 5,
};
