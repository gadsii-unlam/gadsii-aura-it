import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  BACKSTAGE_KEY_HEADER,
  nextKitchenStatus,
  type Order,
  type OrderStatus,
  type PaymentSimulationState,
  type Product,
  type SimulatedPaymentMode,
} from '@buffetya/shared';
import { forkJoin, type Observable } from 'rxjs';
import { formatClock } from '../core/format';
import { THEME_BACKSTAGE, ThemeColor } from '../core/theme-color';

const KEY_STORAGE = 'buffetya.backstageKey';
const REFRESH_MS = 3_000;

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  received: 'Recibido',
  preparing: 'En preparación',
  ready: 'Listo',
};

/** The button colour predicts where the order goes: amber → preparing, green → ready. */
const ADVANCE: Partial<Record<OrderStatus, { label: string; className: string }>> = {
  preparing: { label: 'Pasar a preparación', className: 'btn--warn' },
  ready: { label: 'Marcar listo', className: 'btn--go' },
  delivered: { label: 'Marcar entregado', className: 'btn--ghost' },
};

function readKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

/**
 * Team-only backstage (/backstage, not linked from the app). This is how the
 * MVP simulates what happens "behind the scenes": the buffet moving orders
 * through the kitchen, running out of stock, and Mercado Pago rejecting a
 * payment. Protected by the BACKSTAGE_KEY, kept in sessionStorage.
 */
@Component({
  selector: 'app-backstage-page',
  template: `
    <div class="bs">
      <header class="bs__bar">
        <div class="bs__grow">
          <h1>Backstage · BuffetYa!</h1>
          <p class="bs__sub">Solo para el equipo durante las pruebas. No es parte de la app.</p>
        </div>
        @if (key()) {
          <button class="btn btn--ghost btn--sm" type="button" (click)="logout()">Salir</button>
        }
      </header>

      @if (!key()) {
        <form class="card bs__login" (submit)="login($event, keyInput.value)">
          <div class="field">
            <label class="field__label" for="bs-key">Clave de backstage</label>
            <input #keyInput id="bs-key" class="input" type="password" autocomplete="current-password" required />
            <p class="field__hint">La que está en BACKSTAGE_KEY del servidor.</p>
          </div>
          @if (error()) {
            <p class="field__error" role="alert">{{ error() }}</p>
          }
          <button class="btn btn--primary" type="submit">Entrar</button>
        </form>
      } @else {
        <div class="bs__main">
          <section class="stack gap3" aria-labelledby="bs-orders">
            <h2 class="section__title" id="bs-orders">Pedidos en la cocina ({{ orders().length }})</h2>
            @if (error()) {
              <div class="notice notice--alert" role="alert">{{ error() }}</div>
            }
            @if (orders().length === 0) {
              <p class="bs__hint">No hay pedidos pagados en curso. Los pedidos sin pagar no entran a la cocina.</p>
            }
            <div class="bs__tickets">
              @for (order of orders(); track order.id) {
                <article class="bs__ticket">
                  <div class="bs__ticket-top">
                    <span class="bs__code">{{ order.pickupCode }}</span>
                    <span class="bs__who">{{ order.customerName }} · {{ paidAt(order) }}</span>
                    <span class="bs__state" [class]="'bs__state--' + order.status">{{ statusLabel(order.status) }}</span>
                  </div>
                  <div class="bs__items">
                    @for (item of order.items; track item.productId) {
                      <span><b>{{ item.quantity }}×</b> {{ item.name }}</span>
                    }
                  </div>
                  <div class="bs__actions">
                    @if (advance(order); as next) {
                      <button
                        class="btn btn--sm"
                        [class]="next.className"
                        type="button"
                        [disabled]="busy()"
                        (click)="setStatus(order, next.to)"
                      >
                        {{ next.label }}
                      </button>
                    }
                    <button class="btn btn--sm btn--danger" type="button" [disabled]="busy()" (click)="setStatus(order, 'cancelled')">
                      Cancelar
                    </button>
                  </div>
                </article>
              }
            </div>
          </section>

          <aside class="stack gap3">
            <section class="card bs__panel" aria-labelledby="bs-payment">
              <h2 id="bs-payment">Próximo pago (Mercado Pago simulado)</h2>
              <p class="bs__hint">
                "Rechazar" afecta solo al próximo pago; después vuelve a aprobar. Sirve para probar 04b · Pago rechazado.
              </p>
              <div class="bs__actions">
                <button
                  class="btn btn--sm"
                  [class.btn--primary]="nextPayment() === 'approve'"
                  [class.btn--ghost]="nextPayment() !== 'approve'"
                  type="button"
                  [attr.aria-pressed]="nextPayment() === 'approve'"
                  (click)="setNextPayment('approve')"
                >
                  Aprobar
                </button>
                <button
                  class="btn btn--sm"
                  [class.btn--danger]="nextPayment() !== 'reject'"
                  [class.btn--primary]="nextPayment() === 'reject'"
                  type="button"
                  [attr.aria-pressed]="nextPayment() === 'reject'"
                  (click)="setNextPayment('reject')"
                >
                  Rechazar el próximo
                </button>
              </div>
            </section>

            <section class="card bs__panel" aria-labelledby="bs-stock">
              <h2 id="bs-stock">Stock</h2>
              <p class="bs__hint">Un producto sin stock sigue en el menú, marcado "SIN STOCK" y sin el botón de agregar.</p>
              <div>
                @for (product of products(); track product.id) {
                  <div class="bs__product">
                    <span>{{ product.name }}</span>
                    <label class="bs__switch">
                      <input
                        type="checkbox"
                        [checked]="product.available"
                        (change)="setAvailability(product, $any($event.target).checked)"
                      />
                      {{ product.available ? 'Hay' : 'Sin stock' }}
                    </label>
                  </div>
                }
              </div>
            </section>
          </aside>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackstagePage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly theme = inject(ThemeColor);

  protected readonly key = signal(readKey());
  protected readonly orders = signal<Order[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly nextPayment = signal<SimulatedPaymentMode>('approve');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  constructor() {
    const timer = setInterval(() => this.refresh(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.theme.set(THEME_BACKSTAGE);
    this.refresh();
  }

  ngOnDestroy(): void {
    this.theme.reset();
  }

  protected login(event: Event, key: string): void {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    try {
      sessionStorage.setItem(KEY_STORAGE, trimmed);
    } catch {
      // The key then lives only in memory for this visit.
    }
    this.error.set(null);
    this.key.set(trimmed);
    this.refresh();
  }

  protected logout(): void {
    try {
      sessionStorage.removeItem(KEY_STORAGE);
    } catch {
      // Nothing stored.
    }
    this.key.set('');
  }

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABEL[status] ?? status;
  }

  protected paidAt(order: Order): string {
    return order.paidAt ? formatClock(order.paidAt) : '';
  }

  protected advance(order: Order) {
    const to = nextKitchenStatus(order.status);
    const style = to ? ADVANCE[to] : undefined;
    return to && style ? { to, ...style } : null;
  }

  protected setStatus(order: Order, status: OrderStatus): void {
    if (status === 'cancelled' && !confirm(`¿Cancelar el pedido ${order.pickupCode}?`)) return;
    this.run(this.http.post<Order>(`/api/backstage/orders/${order.id}/status`, { status }, this.options()));
  }

  protected setAvailability(product: Product, available: boolean): void {
    this.run(this.http.patch<Product>(`/api/backstage/products/${product.id}`, { available }, this.options()));
  }

  protected setNextPayment(nextResult: SimulatedPaymentMode): void {
    this.run(this.http.put<PaymentSimulationState>('/api/backstage/payments/next', { nextResult }, this.options()));
  }

  private run(request: Observable<unknown>): void {
    this.busy.set(true);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.refresh();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.handleError(error);
      },
    });
  }

  private refresh(): void {
    if (!this.key()) return;
    forkJoin({
      orders: this.http.get<Order[]>('/api/backstage/orders', this.options()),
      payment: this.http.get<PaymentSimulationState>('/api/backstage/payments/next', this.options()),
      products: this.http.get<Product[]>('/api/products'),
    }).subscribe({
      next: ({ orders, payment, products }) => {
        this.orders.set(orders);
        this.nextPayment.set(payment.nextResult);
        this.products.set(products);
        this.error.set(null);
      },
      error: (error: unknown) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.logout();
      this.error.set('Clave incorrecta.');
    } else if (error instanceof HttpErrorResponse && error.status === 503) {
      this.error.set('El backstage está deshabilitado en el servidor (falta BACKSTAGE_KEY).');
    } else if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      this.error.set(error.error.message);
    } else {
      this.error.set('No hay conexión con el servidor.');
    }
  }

  private options(): { headers: HttpHeaders } {
    return { headers: new HttpHeaders({ [BACKSTAGE_KEY_HEADER]: this.key() }) };
  }
}
