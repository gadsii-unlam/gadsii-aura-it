import type { OrderStatus } from '@buffetya/shared';

export interface OrderRef {
  id: string;
  status: OrderStatus;
}

/** 05 for an order, or 06 when it is ready. */
export function orderUrl(order: OrderRef): string {
  const base = `/pedido/${encodeURIComponent(order.id)}`;
  return order.status === 'ready' ? `${base}/listo` : base;
}

/**
 * Where the "Mis pedidos" tab lands. One order goes straight to its screen,
 * as the wireframe draws it; none or several stay on /pedido (empty state or
 * list). Null means "stay".
 */
export function ordersLandingUrl(orders: readonly OrderRef[]): string | null {
  return orders.length === 1 ? orderUrl(orders[0]) : null;
}

/** The old single-order /pedido/listo link: the order that is ready, if any. */
export function legacyReadyUrl(orders: readonly OrderRef[]): string {
  const ready = orders.filter((order) => order.status === 'ready').at(-1);
  if (ready) return orderUrl(ready);
  return orders.length === 1 ? orderUrl(orders[0]) : '/pedido';
}
