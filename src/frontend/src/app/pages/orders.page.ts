import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PICKUP_POINT_NAME } from '@buffetya/shared';
import { capitalize, formatArs, formatProductCount, formatWhen } from '../core/format';
import { LIST_PRIORITY, STATUS_ICON, STATUS_LABEL } from '../core/order-status-view';
import { orderUrl } from '../core/orders-routing';
import { OrdersStore, type OrderEntry } from '../core/orders.store';
import { Icon } from '../ui/icon';
import { TabBar } from '../ui/tab-bar';

interface Row {
  id: string;
  url: string;
  code: string;
  status: OrderEntry['status'];
  label: string;
  icon: string;
  summary: string;
  when: string;
}

/**
 * "Mis pedidos". Not a history: only orders in progress (and a cancellation
 * the customer has not seen yet). With one order the tab skips this screen and
 * opens it directly; this list is what two or more orders look like.
 */
@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, Icon, TabBar],
  template: `
    <main class="phone">
      <header class="appbar">
        <div class="appbar__grow">
          <h1 class="appbar__title">Mis pedidos</h1>
          <p class="appbar__sub">{{ pickupPoint }}</p>
        </div>
      </header>

      <div class="screen">
        @if (rows().length === 0) {
          <div class="empty">
            <span class="empty__icon"><svg appIcon="package"></svg></span>
            <h2 class="empty__title">No tenés pedidos en curso</h2>
            <p class="empty__text">Cuando pagues un pedido, vas a ver acá su estado y el código para retirarlo.</p>
            <a class="btn btn--primary" routerLink="/">Ver el menú</a>
          </div>
        } @else {
          <section class="section" aria-labelledby="orders-title">
            <div class="section__head">
              <h2 class="section__title" id="orders-title">En curso</h2>
              <span class="sm muted">{{ count() }}</span>
            </div>
          </section>
          <ul class="orderlist" aria-live="polite">
            @for (row of rows(); track row.id) {
              <li>
                <a class="ordercard" [routerLink]="row.url">
                  <span class="ordercard__code">{{ row.code }}</span>
                  <span class="ordercard__body">
                    <span class="pill" [class]="'pill--' + row.status">
                      <svg [appIcon]="row.icon"></svg>{{ row.label }}
                    </span>
                    <span class="ordercard__meta">{{ row.summary }}</span>
                    <span class="ordercard__time">{{ row.when }}</span>
                  </span>
                  <svg appIcon="chevronRight" class="ordercard__chev"></svg>
                </a>
              </li>
            }
          </ul>
        }
      </div>

      <app-tab-bar />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly store = inject(OrdersStore);
  protected readonly pickupPoint = PICKUP_POINT_NAME;

  protected readonly rows = computed<Row[]>(() =>
    [...this.store.entries()]
      .sort(
        (a, b) =>
          LIST_PRIORITY[a.status] - LIST_PRIORITY[b.status] ||
          (a.order?.paidAt ?? '').localeCompare(b.order?.paidAt ?? ''),
      )
      .map((entry) => {
        const units = entry.order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
        return {
          id: entry.id,
          url: orderUrl(entry),
          code: entry.pickupCode ?? entry.order?.pickupCode ?? 'Pedido',
          status: entry.status,
          label: STATUS_LABEL[entry.status],
          icon: STATUS_ICON[entry.status],
          summary: entry.order ? `${formatProductCount(units)} · ${formatArs(entry.order.totalCents)}` : '',
          when: entry.order?.paidAt ? capitalize(formatWhen(entry.order.paidAt)) : '',
        };
      }),
  );
  protected readonly count = computed(() => this.rows().length);

  ngOnInit(): void {
    this.store.refresh();
  }
}
