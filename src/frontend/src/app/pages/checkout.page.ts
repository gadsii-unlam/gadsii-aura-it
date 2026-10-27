import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PICKUP_POINT_NAME, type Order } from '@buffetya/shared';
import { OrdersStore } from '../core/orders.store';
import { ApiClient, apiErrorOf } from '../core/api.client';
import { CartStore } from '../core/cart.store';
import { formatArs } from '../core/format';
import { Icon } from '../ui/icon';

/**
 * The Mercado Pago checkout step of 03 → 04a/04b (simulated in the MVP: the
 * outcome comes from the backend's SimulatedPaymentGateway, which the team can
 * set to reject the next payment from the backstage). Named in text only — no
 * logos or artwork — and it never asks for card numbers, passwords or any
 * other credential.
 */
@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink, Icon],
  template: `
    <main class="phone">
      <header class="checkout__bar">
        <span class="checkout__brand">Mercado Pago</span>
      </header>

      <div class="screen screen--dock-2">
        @if (order(); as current) {
          <div class="section">
            <div class="card pad4 center">
              <p class="cap muted">Estás pagando a</p>
              <p class="checkout__merchant">BuffetYa! · {{ pickupPoint }}</p>
              <p class="checkout__amount">{{ money(current.totalCents) }}</p>
              <p class="sm muted">Pedido a nombre de {{ current.customerName }}</p>
            </div>
          </div>

          <div class="section">
            <div class="section__head"><h2 class="section__title" id="mp-method">Pagás con</h2></div>
            <div class="card optlist" role="radiogroup" aria-labelledby="mp-method">
              <label class="opt">
                <input type="radio" name="mp-method" value="account_money" checked />
                <span class="opt__dot"></span>
                <span class="opt__grow">
                  <span class="opt__name">Dinero en cuenta</span>
                  <span class="opt__meta">Disponible en tu cuenta de Mercado Pago</span>
                </span>
                <span class="opt__mark"><svg appIcon="card"></svg></span>
              </label>
            </div>
          </div>
        } @else if (loadError()) {
          <div class="empty" role="alert">
            <span class="empty__icon"><svg appIcon="alert"></svg></span>
            <h2 class="empty__title">No encontramos el pago</h2>
            <p class="empty__text">{{ loadError() }}</p>
            <a class="btn btn--ghost" routerLink="/carrito">Volver a mi carrito</a>
          </div>
        } @else {
          <p class="empty__text pad4" aria-live="polite">Cargando el pago…</p>
        }

        @if (payError()) {
          <div class="pad4">
            <div class="notice notice--alert" role="alert">
              <svg appIcon="alert"></svg>
              <div class="notice__body">
                <span>{{ payError() }}</span>
                <a routerLink="/carrito">Revisar mi carrito</a>
              </div>
            </div>
          </div>
        }
      </div>

      @if (order(); as current) {
        <div class="dock">
          <button
            class="btn btn--primary btn--block"
            type="button"
            [attr.data-loading]="paying() ? 'true' : null"
            [attr.aria-busy]="paying()"
            (click)="pay(current)"
          >
            <svg appIcon="lock"></svg>Pagar {{ money(current.totalCents) }}
          </button>
          <a class="btn btn--quiet btn--block" routerLink="/pago">Cancelar</a>
        </div>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  /** Route parameter. */
  readonly orderId = input.required<string>();

  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly cart = inject(CartStore);
  private readonly orders = inject(OrdersStore);

  protected readonly pickupPoint = PICKUP_POINT_NAME;
  protected readonly money = formatArs;
  protected readonly order = signal<Order | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly payError = signal<string | null>(null);
  protected readonly paying = signal(false);

  ngOnInit(): void {
    this.api.order(this.orderId()).subscribe({
      next: (order) => {
        if (order.status !== 'awaiting_payment') {
          // Already paid (e.g. the back button): show the outcome instead.
          this.approved(order);
          return;
        }
        this.order.set(order);
      },
      error: () => this.loadError.set('Este pago ya no está disponible. Volvé a tu carrito para intentarlo de nuevo.'),
    });
  }

  protected pay(order: Order): void {
    if (this.paying()) return;
    this.paying.set(true);
    this.payError.set(null);
    this.api.pay(order.id).subscribe({
      next: (payment) => {
        this.paying.set(false);
        if (payment.result === 'approved') {
          this.approved(payment.order);
        } else {
          void this.router.navigate(['/pago/rechazado', order.id], { replaceUrl: true });
        }
      },
      error: (error: unknown) => {
        this.paying.set(false);
        const apiError = apiErrorOf(error);
        if (apiError?.code === 'PRODUCT_UNAVAILABLE') {
          this.payError.set('Uno de los productos se quedó sin stock, así que no se cobró nada.');
        } else if (apiError?.code === 'PAYMENT_NOT_ALLOWED') {
          this.ngOnInit();
        } else {
          this.payError.set('No pudimos procesar el pago. No se te cobró nada: probá de nuevo.');
        }
      },
    });
  }

  private approved(order: Order): void {
    if (order.paymentStatus !== 'approved') {
      this.loadError.set('Este pedido ya no se puede pagar.');
      return;
    }
    // The cart has become an order: it is emptied only now that it is paid.
    // Other orders in progress are left as they are: this one joins them.
    if (!this.orders.isTracked(order.id)) {
      this.cart.clear();
      this.orders.add(order);
    }
    void this.router.navigate(['/pago/aprobado', order.id], { replaceUrl: true });
  }
}
