import { computed, inject, Injectable, signal } from '@angular/core';
import type { Product } from '@buffetya/shared';
import { ApiClient } from './api.client';
import { CartStore } from './cart.store';

export type CatalogState = 'idle' | 'loading' | 'ready' | 'error';

/** The menu as the server has it right now, stock included. */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly api = inject(ApiClient);
  private readonly cart = inject(CartStore);

  readonly products = signal<Product[]>([]);
  readonly state = signal<CatalogState>('idle');
  readonly byId = computed(() => new Map(this.products().map((product) => [product.id, product])));

  /** Refreshes the menu. Keeps showing the last copy if the refresh fails. */
  load(): void {
    if (this.state() === 'loading') return;
    this.state.set('loading');
    this.api.products().subscribe({
      next: (products) => {
        this.products.set(products);
        this.state.set('ready');
        this.cart.syncWithCatalog(products);
      },
      error: () => this.state.set(this.products().length > 0 ? 'ready' : 'error'),
    });
  }
}
