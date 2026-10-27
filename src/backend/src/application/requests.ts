import type {
  CartItemRequest,
  CreateOrderRequest,
  OrderStatus,
  SimulatedPaymentMode,
} from '@buffetya/shared';
import { invalid } from '../domain/errors.js';

/**
 * Shape checks for request bodies. Business rules (quantity ranges, stock,
 * name length) live in the domain; this only turns `unknown` into typed input.
 */

const MAX_PRODUCT_ID_LENGTH = 64;
const STATUSES: readonly OrderStatus[] = [
  'awaiting_payment',
  'received',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseCartItems(body: unknown): CartItemRequest[] {
  if (!isRecord(body) || !Array.isArray(body['items'])) {
    throw invalid('Falta la lista de productos.');
  }
  return body['items'].map((item: unknown) => {
    if (!isRecord(item)) {
      throw invalid('Hay un producto mal formado en el pedido.');
    }
    const { productId, quantity } = item;
    if (
      typeof productId !== 'string' ||
      productId.length === 0 ||
      productId.length > MAX_PRODUCT_ID_LENGTH
    ) {
      throw invalid('Hay un producto sin identificador válido.');
    }
    if (typeof quantity !== 'number') {
      throw invalid('Cada producto tiene que tener una cantidad numérica.');
    }
    return { productId, quantity };
  });
}

export function parseCreateOrder(body: unknown): CreateOrderRequest {
  const items = parseCartItems(body);
  const customerName = isRecord(body) ? body['customerName'] : undefined;
  // The name itself is validated by the domain (normalizeCustomerName).
  return { customerName: customerName as string, items };
}

/** Most orders one device follows over a single stream. */
export const MAX_FOLLOWED_ORDERS = 10;

/** `?ids=a,b,c` for the multi-order SSE stream. */
export function parseOrderIds(raw: unknown): string[] {
  if (typeof raw !== 'string') {
    throw invalid('Faltan los pedidos a seguir.');
  }
  const ids = [...new Set(raw.split(',').map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0 || ids.length > MAX_FOLLOWED_ORDERS) {
    throw invalid(`Se pueden seguir entre 1 y ${MAX_FOLLOWED_ORDERS} pedidos a la vez.`);
  }
  if (ids.some((id) => id.length > MAX_PRODUCT_ID_LENGTH)) {
    throw invalid('Hay un pedido con un identificador inválido.');
  }
  return ids;
}

export function parseStatus(body: unknown): OrderStatus {
  const status = isRecord(body) ? body['status'] : undefined;
  if (typeof status !== 'string' || !STATUSES.includes(status as OrderStatus)) {
    throw invalid('Estado de pedido desconocido.');
  }
  return status as OrderStatus;
}

export function parseAvailability(body: unknown): boolean {
  const available = isRecord(body) ? body['available'] : undefined;
  if (typeof available !== 'boolean') {
    throw invalid('"available" tiene que ser true o false.');
  }
  return available;
}

export function parsePaymentMode(body: unknown): SimulatedPaymentMode {
  const mode = isRecord(body) ? body['nextResult'] : undefined;
  if (mode !== 'approve' && mode !== 'reject') {
    throw invalid('"nextResult" tiene que ser "approve" o "reject".');
  }
  return mode;
}
