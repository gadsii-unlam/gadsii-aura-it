import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PICKUP_POINT_NAME, type Order } from '@buffetya/shared';
import { capitalize, formatClock, formatWhen } from '../core/format';
import { OrdersStore } from '../core/orders.store';
import { THEME_READY, ThemeColor } from '../core/theme-color';
import { Icon } from '../ui/icon';
import { TabBar } from '../ui/tab-bar';

/**
 * 06 · Listo para retirar, for one order (/pedido/:orderId/listo). The whole
 * first viewport turns to the ready green (DESIGN.md, "The Ready Field Rule")
 * and the code is reframed with the instruction to show it.
 */
@Component({
  selector: 'app-order-ready-page',
  imports: [RouterLink, Icon, TabBar],
  template: `
    <main class="phone">
      @if (order(); as current) {
        <header class="appbar appbar--ready">
          @if (showBack()) {
            <a class="iconbtn" routerLink="/pedido" aria-label="Volver a mis pedidos">
              <svg appIcon="arrowLeft"></svg>
            </a>
          }
          <div class="appbar__grow">
            <h1 class="appbar__title">Pedido {{ current.pickupCode }}</h1>
            <p class="appbar__sub">{{ when(current) }} · {{ pickupPoint }}</p>
          </div>
        </header>

        <div class="screen">
          <section class="status status--ready" aria-live="assertive" aria-atomic="true">
            <div class="status__icon"><svg appIcon="checkBig"></svg></div>
            <p class="status__label">Estado actual</p>
            <h2 class="status__title">Listo para retirar</h2>
            @if (current.pickupDeadlineAt) {
              <p class="status__eta"><svg appIcon="clock"></svg>Te esperamos hasta las {{ clock(current.pickupDeadlineAt) }}.</p>
            }
            <div class="code">
              <div class="code__label">Mostrá este código</div>
              <div class="code__value">{{ current.pickupCode }}</div>
            </div>
          </section>

          <div class="pad4 stack gap3">
            @if (showBack()) {
              <a class="btn btn--ghost btn--block" routerLink="/pedido"><svg appIcon="package"></svg>Ver mis pedidos</a>
            }
            <a class="btn btn--ghost btn--block" routerLink="/"><svg appIcon="list"></svg>Volver al menú</a>
          </div>
        </div>
      } @else {
        <p class="empty__text pad4" aria-live="polite">Cargando tu pedido…</p>
      }
      <app-tab-bar />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderReadyPage implements OnInit, OnDestroy {
  /** Route parameter. */
  readonly orderId = input.required<string>();

  protected readonly store = inject(OrdersStore);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeColor);
  protected readonly pickupPoint = PICKUP_POINT_NAME;

  protected readonly order = computed(() => this.store.orderById(this.orderId()));
  protected readonly showBack = computed(() => this.store.count() >= 2);

  constructor() {
    effect(() => {
      const id = this.orderId();
      untracked(() => this.store.watch(id));
    });
    // Only a ready order belongs here; anything else goes back to its 05.
    effect(() => {
      const id = this.orderId();
      const order = this.order();
      if ((order && order.status !== 'ready') || (!order && this.store.isUnreachable(id))) {
        void this.router.navigateByUrl(`/pedido/${encodeURIComponent(id)}`, { replaceUrl: true });
      }
    });
  }

  ngOnInit(): void {
    this.theme.set(THEME_READY);
  }

  ngOnDestroy(): void {
    this.theme.reset();
  }

  protected when(order: Order): string {
    return capitalize(formatWhen(order.paidAt ?? order.createdAt));
  }

  protected clock(iso: string): string {
    return formatClock(iso);
  }
}
