import { computed, inject, Injectable, signal } from '@angular/core';
import type { CartItemRequest, Product } from '@buffetya/shared';
import { APP_STORAGE, readJson } from './storage';

export interface CartLine {
  productId: string;
  name: string;
  /** Display price only: the server always reprices the order. */
  unitPriceCents: number;
  quantity: number;
}

export const CART_STORAGE_KEY = 'buffetya.cart.v1';

/** Same limit the server enforces per product. */
export const MAX_QUANTITY = 20;

function isCartLines(value: unknown): value is CartLine[] {
  return (
    Array.isArray(value) &&
    value.every(
      (line) =>
        typeof line === 'object' &&
        line !== null &&
        typeof line.productId === 'string' &&
        typeof line.name === 'string' &&
        Number.isInteger(line.unitPriceCents) &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        line.quantity <= MAX_QUANTITY,
    )
  );
}

/**
 * "Mi carrito": what the customer is putting together before paying. Lives in
 * the device (localStorage), so it survives reloads and a rejected payment
 * (04b · "Tu carrito sigue armado"). Cleared only when a payment is approved.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly storage = inject(APP_STORAGE);
  private readonly state = signal<CartLine[]>(
    readJson(this.storage, CART_STORAGE_KEY, isCartLines) ?? [],
  );

  readonly lines = this.state.asReadonly();
  readonly isEmpty = computed(() => this.state().length === 0);
  /** Units, as in "2 productos · $8.000". */
  readonly count = computed(() => this.state().reduce((sum, line) => sum + line.quantity, 0));
  readonly totalCents = computed(() =>
    this.state().reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
  );
  private readonly quantities = computed(
    () => new Map(this.state().map((line) => [line.productId, line.quantity])),
  );

  quantityOf(productId: string): number {
    return this.quantities().get(productId) ?? 0;
  }

  /** The "+" on a menu card: one more unit, without leaving the menu. */
  add(product: Pick<Product, 'id' | 'name' | 'priceCents'>): void {
    if (this.quantityOf(product.id) > 0) {
      this.increment(product.id);
      return;
    }
    this.commit([
      ...this.state(),
      { productId: product.id, name: product.name, unitPriceCents: product.priceCents, quantity: 1 },
    ]);
  }

  increment(productId: string): void {
    this.update(productId, (quantity) => Math.min(MAX_QUANTITY, quantity + 1));
  }

  /** At zero the product leaves the cart and the card shows "+" again. */
  decrement(productId: string): void {
    this.update(productId, (quantity) => quantity - 1);
  }

  remove(productId: string): void {
    this.update(productId, () => 0);
  }

  clear(): void {
    this.commit([]);
  }

  /** Keeps names and prices current and drops products that left the menu. */
  syncWithCatalog(products: readonly Product[]): void {
    const byId = new Map(products.map((product) => [product.id, product]));
    const synced = this.state()
      .filter((line) => byId.has(line.productId))
      .map((line) => {
        const product = byId.get(line.productId) as Product;
        return { ...line, name: product.name, unitPriceCents: product.priceCents };
      });
    const changed =
      synced.length !== this.state().length ||
      synced.some(
        (line, index) =>
          line.name !== this.state()[index].name ||
          line.unitPriceCents !== this.state()[index].unitPriceCents,
      );
    if (changed) this.commit(synced);
  }

  requestItems(): CartItemRequest[] {
    return this.state().map(({ productId, quantity }) => ({ productId, quantity }));
  }

  private update(productId: string, change: (quantity: number) => number): void {
    if (this.quantityOf(productId) === 0) return;
    const next = this.state()
      .map((line) => (line.productId === productId ? { ...line, quantity: change(line.quantity) } : line))
      .filter((line) => line.quantity > 0);
    this.commit(next);
  }

  private commit(lines: CartLine[]): void {
    this.state.set(lines);
    if (lines.length === 0) {
      this.storage.removeItem(CART_STORAGE_KEY);
    } else {
      this.storage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    }
  }
}
