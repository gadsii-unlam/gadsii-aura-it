import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Order } from '@buffetya/shared';
import { orderUrl } from '../core/orders-routing';
import { OrdersStore } from '../core/orders.store';
import { ApiClient } from '../core/api.client';
import { formatWhen } from '../core/format';
import { ReadyNotifier } from '../core/ready-notifier';
import { Icon } from '../ui/icon';
import { OrderSummary } from '../ui/order-summary';

/**
 * 04a · Pago aprobado. Says the result in words, repeats what was charged, and
 * has a single way forward. It waits for the tap instead of moving on by
 * itself (the wireframe leaves that open for the usability test).
 */
@Component({
  selector: 'app-payment-approved-page',
  imports: [RouterLink, Icon, OrderSummary],
  template: `
    <main class="phone">
      @if (order(); as current) {
        <header class="appbar">
          <div class="appbar__grow">
            <h1 class="appbar__title">Pago aprobado</h1>
            <p class="appbar__sub">Pedido {{ current.pickupCode }}</p>
          </div>
        </header>

        <div class="screen screen--dock">
          <section class="status status--approved" role="status">
            <div class="status__icon"><svg appIcon="check"></svg></div>
            <p class="status__label">Resultado del pago</p>
            <h2 class="status__title">Aprobado</h2>
            <p class="status__meta">Mercado Pago · {{ when(current) }}</p>
          </section>

          <div style="margin-top: var(--s4)">
            <app-order-summary [order]="current" />
          </div>

          <div class="pad4">
            <div class="notice notice--info">
              <svg appIcon="bell"></svg>
              <div>Ya lo mandamos a la cocina. Te avisamos al celular cuando esté listo para retirar.</div>
            </div>
          </div>
        </div>

        <div class="dock">
          <button class="btn btn--primary btn--block" type="button" (click)="seeStatus()">
            Ver el estado del pedido
          </button>
        </div>
      } @else if (failed()) {
        <div class="empty" role="alert">
          <span class="empty__icon"><svg appIcon="alert"></svg></span>
          <h1 class="empty__title">No encontramos el pedido</h1>
          <a class="btn btn--ghost" routerLink="/">Volver al menú</a>
        </div>
      } @else {
        <p class="empty__text pad4" aria-live="polite">Cargando el pedido…</p>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentApprovedPage implements OnInit {
  /** Route parameter. */
  readonly orderId = input.required<string>();

  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly orders = inject(OrdersStore);
  private readonly notifier = inject(ReadyNotifier);

  protected readonly order = signal<Order | null>(null);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    const known = this.orders.orderById(this.orderId());
    if (known) {
      this.order.set(known);
      return;
    }
    this.api.order(this.orderId()).subscribe({
      next: (order) => {
        if (order.paymentStatus !== 'approved') {
          void this.router.navigateByUrl('/pago', { replaceUrl: true });
          return;
        }
        this.order.set(order);
      },
      error: () => this.failed.set(true),
    });
  }

  protected when(order: Order): string {
    return formatWhen(order.paidAt ?? order.createdAt);
  }

  /**
   * The tap that leads to "Te avisamos al celular": the moment to ask for the
   * notification permission (browsers only show the prompt inside a gesture).
   * 05 offers the same button again if the prompt was dismissed.
   */
  protected seeStatus(): void {
    void this.notifier.requestPermission();
    // This order's own screen, even when others are in progress.
    const order = this.order();
    void this.router.navigateByUrl(order ? orderUrl(order) : '/pedido');
  }
}
