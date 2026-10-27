import type { CartItemRequest, OrderItem, Product } from '@buffetya/shared';
import { DomainError, invalid } from './errors.js';

export const MAX_QUANTITY_PER_ITEM = 20;
export const MAX_LINES_PER_ORDER = 30;

export interface PricedItems {
  items: OrderItem[];
  totalCents: number;
}

/**
 * Prices a cart against the catalog. The server never trusts client prices or
 * totals: only product ids and quantities are read from the request.
 */
export function priceItems(
  requested: readonly CartItemRequest[],
  catalog: readonly Product[],
): PricedItems {
  if (requested.length === 0) {
    throw invalid('El pedido no tiene productos.');
  }

  // Merge repeated lines first, so the quantity limit applies per product.
  const quantities = new Map<string, number>();
  for (const { productId, quantity } of requested) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw invalid('Cada producto tiene que tener una cantidad entera de al menos 1.');
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  if (quantities.size > MAX_LINES_PER_ORDER) {
    throw invalid(`Un pedido puede tener hasta ${MAX_LINES_PER_ORDER} productos distintos.`);
  }
  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      throw invalid(`Se pueden pedir hasta ${MAX_QUANTITY_PER_ITEM} unidades de cada producto.`);
    }
  }

  const byId = new Map(catalog.map((product) => [product.id, product]));
  const unknown = [...quantities.keys()].filter((id) => !byId.has(id));
  if (unknown.length > 0) {
    throw new DomainError('UNKNOWN_PRODUCT', 'Hay productos que no están en el menú.', unknown);
  }
  const unavailable = [...quantities.keys()].filter((id) => !byId.get(id)?.available);
  if (unavailable.length > 0) {
    throw new DomainError(
      'PRODUCT_UNAVAILABLE',
      'Hay productos que se quedaron sin stock.',
      unavailable,
    );
  }

  const items: OrderItem[] = [...quantities].map(([productId, quantity]) => {
    const product = byId.get(productId) as Product;
    return {
      productId,
      name: product.name,
      quantity,
      unitPriceCents: product.priceCents,
      lineTotalCents: product.priceCents * quantity,
    };
  });
  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return { items, totalCents };
}
