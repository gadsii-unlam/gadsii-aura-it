import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Order } from '@buffetya/shared';
import { ApiClient } from '../core/api.client';
import { CartStore } from '../core/cart.store';
import { formatArs, formatEstimate, formatWhen } from '../core/format';
import { Icon } from '../ui/icon';

/**
 * 04b · Pago rechazado. First that nothing was charged, then what to do. The
 * cart is still there: nothing was cleared, and the order never entered the
 * kitchen.
 */
@Component({
  selector: 'app-payment-rejected-page',
  imports: [RouterLink, Icon],
  template: `
    <main class="phone">
      <header class="appbar">
        <a class="iconbtn" routerLink="/carrito" aria-label="Volver a mi carrito"><svg appIcon="arrowLeft"></svg></a>
        <div class="appbar__grow">
          <h1 class="appbar__title">No se pudo pagar</h1>
          <p class="appbar__sub">Tu carrito sigue armado</p>
        </div>
      </header>

      <div class="screen screen--dock-2">
        <section class="status status--rejected" role="status">
          <div class="status__icon"><svg appIcon="x"></svg></div>
          <p class="status__label">Resultado del pago</p>
          <h2 class="status__title">Rechazado</h2>
          <p class="status__meta">Mercado Pago rechazó la operación{{ when() }}</p>
        </section>

        <div class="pad4">
          <div class="card pad4 stack gap2">
            <h3 class="section__title">No se te cobró nada</h3>
            <p class="sm muted">
              Tu pedido no entró a la cocina y el carrito quedó igual, {{ cartPhrase() }}. Podés probar
              de nuevo o cambiar el medio de pago.
            </p>
          </div>
        </div>

        @if (order(); as current) {
          <div class="card card--inset">
            <div class="sum">
              <div class="sum__line"><span>Tiempo estimado</span><b>{{ estimate(current) }}</b></div>
              <div class="sum__rule"></div>
              <div class="sum__total sum__total--sm">
                <span>Total sin pagar</span><b>{{ money(current.totalCents) }}</b>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="dock">
        <a class="btn btn--primary btn--block" routerLink="/pago">Probar de nuevo</a>
        <a class="btn btn--ghost btn--block" routerLink="/carrito">Volver a mi carrito</a>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentRejectedPage implements OnInit {
  /** Route parameter. */
  readonly orderId = input.required<string>();

  private readonly api = inject(ApiClient);
  private readonly cart = inject(CartStore);

  protected readonly order = signal<Order | null>(null);
  protected readonly money = formatArs;

  protected readonly when = computed(() => {
    const at = this.order()?.lastPaymentAttempt?.at;
    return at ? ` · ${formatWhen(at)}` : '';
  });

  /** "con los 2 productos", counted from the cart that is still armed. */
  protected readonly cartPhrase = computed(() => {
    const fromOrder = this.order()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const count = this.cart.count() || fromOrder;
    return count === 1 ? 'con 1 producto' : `con los ${count} productos`;
  });

  ngOnInit(): void {
    this.api.order(this.orderId()).subscribe({
      next: (order) => this.order.set(order),
      error: () => this.order.set(null),
    });
  }

  protected estimate(order: Order): string {
    return formatEstimate(order.estimate);
  }
}
