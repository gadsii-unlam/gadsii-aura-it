import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import type { OrderQuote } from '@buffetya/shared';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { ApiClient, apiErrorOf } from '../core/api.client';
import { CartStore, MAX_QUANTITY } from '../core/cart.store';
import { CatalogStore } from '../core/catalog.store';
import { formatArs, formatEstimate } from '../core/format';
import { Icon } from '../ui/icon';
import { ProductPhoto } from '../ui/product-photo';

type QuoteState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; quote: OrderQuote }
  | { kind: 'error'; unavailable: string[] };

/**
 * 02 · Mi carrito ("Paso 1 de 2"). The whole cart, the time estimate and the
 * total, before committing money. "Carrito", not "pedido": the order is what
 * was already paid and is in the kitchen.
 */
@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, Icon, ProductPhoto],
  template: `
    <main class="phone">
      <header class="appbar">
        <a class="iconbtn" routerLink="/" aria-label="Volver al menú"><svg appIcon="arrowLeft"></svg></a>
        <div class="appbar__grow">
          <h1 class="appbar__title">Mi carrito</h1>
          <p class="appbar__sub">Paso 1 de 2</p>
        </div>
      </header>

      @if (cart.isEmpty()) {
        <div class="screen">
          <div class="empty">
            <span class="empty__icon"><svg appIcon="bag"></svg></span>
            <h2 class="empty__title">Tu carrito está vacío</h2>
            <p class="empty__text">Agregá productos desde el menú.</p>
            <a class="btn btn--primary" routerLink="/">Ver el menú</a>
          </div>
        </div>
      } @else {
        <div class="screen screen--dock">
          <section class="section">
            <div class="section__head"><h2 class="section__title">Revisá antes de pagar</h2></div>
          </section>

          <ul class="rows card card--inset" style="overflow: hidden">
            @for (line of cart.lines(); track line.productId) {
              <li class="row">
                <app-product-photo thumb [src]="photoOf(line.productId)" [alt]="line.name" />
                <div class="row__grow">
                  <div class="row__head">
                    <span class="row__name">{{ line.name }}</span>
                    <b class="row__price">{{ money(line.unitPriceCents * line.quantity) }}</b>
                  </div>
                  @if (unavailable().has(line.productId)) {
                    <span><span class="tag tag--out">SIN STOCK</span></span>
                  }
                  <div class="row__controls">
                    <div class="stepper stepper--inline">
                      <button
                        type="button"
                        [attr.aria-label]="'Quitar uno de ' + line.name"
                        [disabled]="line.quantity <= 1"
                        (click)="cart.decrement(line.productId)"
                      >
                        <svg appIcon="minus"></svg>
                      </button>
                      <output aria-live="polite">{{ line.quantity }}</output>
                      <button
                        type="button"
                        [attr.aria-label]="'Agregar uno de ' + line.name"
                        [disabled]="line.quantity >= max"
                        (click)="cart.increment(line.productId)"
                      >
                        <svg appIcon="plus"></svg>
                      </button>
                    </div>
                    <button
                      class="btn btn--quiet btn--sm row__remove"
                      type="button"
                      [attr.aria-label]="'Quitar ' + line.name + ' del carrito'"
                      (click)="cart.remove(line.productId)"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            }
          </ul>

          <div class="pad4">
            <a class="btn btn--ghost btn--block" routerLink="/"><svg appIcon="plus"></svg>Agregar algo más</a>
          </div>

          <div class="card card--inset">
            <div class="sum" aria-live="polite">
              <div class="sum__line"><span>Tiempo estimado</span><b>{{ estimateLabel() }}</b></div>
              <div class="sum__line"><span>Subtotal</span><b>{{ money(cart.totalCents()) }}</b></div>
              <div class="sum__rule"></div>
              <div class="sum__total"><span>Total</span><b>{{ money(cart.totalCents()) }}</b></div>
            </div>
          </div>

          @if (unavailable().size > 0) {
            <div class="pad4">
              <div class="notice notice--alert" role="alert">
                <svg appIcon="alert"></svg>
                <div>Hay productos que se quedaron sin stock. Quitalos para continuar al pago.</div>
              </div>
            </div>
          }
        </div>

        <div class="dock">
          <button class="btn btn--primary btn--block" type="button" [disabled]="unavailable().size > 0" (click)="continue()">
            Continuar al pago
          </button>
        </div>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  protected readonly cart = inject(CartStore);
  private readonly catalog = inject(CatalogStore);
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  protected readonly max = MAX_QUANTITY;
  protected readonly money = formatArs;

  /** Server quote for the time estimate; also catches stock changes early. */
  private readonly quote = toSignal(
    toObservable(this.cart.lines).pipe(
      debounceTime(150),
      switchMap((lines) => {
        if (lines.length === 0) return of<QuoteState>({ kind: 'idle' });
        return this.api.quote(this.cart.requestItems()).pipe(
          map((quote): QuoteState => ({ kind: 'ready', quote })),
          catchError((error: unknown) =>
            of<QuoteState>({ kind: 'error', unavailable: apiErrorOf(error)?.productIds ?? [] }),
          ),
          startWith<QuoteState>({ kind: 'loading' }),
        );
      }),
    ),
    { initialValue: { kind: 'loading' } as QuoteState },
  );

  protected readonly unavailable = computed(() => {
    const ids = new Set<string>();
    const byId = this.catalog.byId();
    for (const line of this.cart.lines()) {
      if (byId.get(line.productId)?.available === false) ids.add(line.productId);
    }
    const quote = this.quote();
    if (quote.kind === 'error') quote.unavailable.forEach((id) => ids.add(id));
    return ids;
  });

  protected readonly estimateLabel = computed(() => {
    const quote = this.quote();
    switch (quote.kind) {
      case 'ready':
        return formatEstimate(quote.quote.estimate);
      case 'error':
        return '—';
      default:
        return 'Calculando…';
    }
  });

  protected photoOf(productId: string): string | undefined {
    return this.catalog.byId().get(productId)?.imageUrl;
  }

  ngOnInit(): void {
    // Fresh stock before the last check.
    this.catalog.load();
  }

  protected continue(): void {
    void this.router.navigateByUrl('/pago');
  }
}
