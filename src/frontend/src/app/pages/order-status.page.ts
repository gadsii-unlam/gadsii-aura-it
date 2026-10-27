import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PICKUP_POINT_NAME, type Order } from '@buffetya/shared';
import { capitalize, formatWhen } from '../core/format';
import { statusView } from '../core/order-status-view';
import { orderUrl } from '../core/orders-routing';
import { OrdersStore } from '../core/orders.store';
import { ReadyNotifier } from '../core/ready-notifier';
import { Icon } from '../ui/icon';
import { OrderSummary } from '../ui/order-summary';
import { TabBar } from '../ui/tab-bar';

const isFinished = (order: Order | null) => order?.status === 'delivered' || order?.status === 'cancelled';

/**
 * 05 · En preparación, for one order (/pedido/:orderId). The state in words,
 * the pickup code as the largest element, and the explicit permission to
 * leave — or, when the browser blocks notifications, an honest note that it
 * cannot keep that promise.
 */
@Component({
  selector: 'app-order-status-page',
  imports: [RouterLink, Icon, OrderSummary, TabBar],
  template: `
    <main class="phone">
      @if (order(); as current) {
        <header class="appbar">
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
          @let status = view();
          <section class="status" [class]="'status--' + status?.status" aria-live="polite" aria-atomic="true">
            <div class="status__icon"><svg [appIcon]="status?.icon ?? 'clock'"></svg></div>
            <p class="status__label">Estado actual</p>
            <h2 class="status__title">{{ status?.title }}</h2>
            @if (status?.detail) {
              <p class="status__eta"><svg appIcon="clock"></svg>{{ status?.detail }}</p>
            }
            @if (status?.showCode) {
              <div class="code">
                <div class="code__label">Código de retiro</div>
                <div class="code__value">{{ current.pickupCode }}</div>
              </div>
            }
          </section>

          @if (status?.showCode) {
            <div class="pad4">
              @switch (notifier.access()) {
                @case ('granted') {
                  <div class="notice notice--info">
                    <svg appIcon="bell"></svg>
                    <div>Te avisamos al celular cuando esté listo para retirar. No hace falta que esperes en esta pantalla.</div>
                  </div>
                }
                @case ('default') {
                  <div class="notice notice--info">
                    <svg appIcon="bell"></svg>
                    <div class="notice__body">
                      <span>Te avisamos al celular cuando esté listo para retirar. No hace falta que esperes en esta pantalla.</span>
                      <button class="btn btn--primary btn--sm" type="button" (click)="enableNotifications()">
                        Activar avisos al celular
                      </button>
                    </div>
                  </div>
                }
                @default {
                  <div class="notice">
                    <svg appIcon="info"></svg>
                    <div>
                      Este navegador no nos deja mandarte avisos. Cuando esté listo vas a verlo en esta pantalla,
                      así que tenela abierta.
                    </div>
                  </div>
                }
              }
            </div>
          } @else {
            <div class="pad4">
              <a class="btn btn--ghost btn--block" routerLink="/"><svg appIcon="list"></svg>Volver al menú</a>
            </div>
          }

          <h2 class="vh">Tu pedido</h2>
          <app-order-summary [order]="current" />
        </div>
      } @else if (store.isUnreachable(orderId())) {
        <div class="screen">
          <div class="empty" role="alert">
            <span class="empty__icon"><svg appIcon="alert"></svg></span>
            <h1 class="empty__title">No pudimos cargar este pedido</h1>
            <p class="empty__text">Revisá tu conexión y probá de nuevo.</p>
            <button class="btn btn--ghost" type="button" (click)="store.watch(orderId())">
              <svg appIcon="refresh"></svg>Reintentar
            </button>
            <a class="btn btn--quiet" routerLink="/pedido">Ver mis pedidos</a>
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
export class OrderStatusPage {
  /** Route parameter. */
  readonly orderId = input.required<string>();

  protected readonly store = inject(OrdersStore);
  protected readonly notifier = inject(ReadyNotifier);
  private readonly router = inject(Router);

  protected readonly pickupPoint = PICKUP_POINT_NAME;
  protected readonly order = computed(() => this.store.orderById(this.orderId()));
  /** With two or more orders, a way back to the list. */
  protected readonly showBack = computed(() => this.store.count() >= 2);
  /** Ticks so "Listo en N minutos" counts down. */
  private readonly now = signal(new Date());
  protected readonly view = computed(() => {
    const order = this.order();
    return order ? statusView(order, this.now()) : null;
  });

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Follow the order on screen; a finished one is forgotten once the
    // customer leaves its final state.
    effect((onCleanup) => {
      const id = this.orderId();
      untracked(() => this.store.watch(id));
      onCleanup(() => {
        if (isFinished(this.store.orderById(id))) this.store.forget(id);
      });
    });

    effect(() => {
      const order = this.order();
      if (!order) return;
      // 06 replaces this screen entirely when the order turns ready.
      if (order.status === 'ready') {
        void this.router.navigateByUrl(orderUrl(order), { replaceUrl: true });
      } else if (isFinished(order)) {
        untracked(() => this.store.markSeen(order.id));
      }
    });
  }

  protected when(order: Order): string {
    return capitalize(formatWhen(order.paidAt ?? order.createdAt));
  }

  protected enableNotifications(): void {
    void this.notifier.requestPermission();
  }
}
