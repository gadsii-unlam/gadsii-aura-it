import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Order } from '@buffetya/shared';
import { formatArs } from '../core/format';

/** What was charged: one line per product and the total ("Total pagado"). */
@Component({
  selector: 'app-order-summary',
  template: `
    <div class="card card--inset">
      <div class="sum">
        @for (item of order().items; track item.productId) {
          <div class="sum__line">
            <span>{{ item.quantity > 1 ? item.quantity + ' × ' : '' }}{{ item.name }}</span>
            <b>{{ money(item.lineTotalCents) }}</b>
          </div>
        }
        <div class="sum__rule"></div>
        <div class="sum__total sum__total--sm">
          <span>{{ totalLabel() }}</span><b>{{ money(order().totalCents) }}</b>
        </div>
      </div>
    </div>
  `,
  host: { style: 'display: block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummary {
  readonly order = input.required<Order>();
  readonly totalLabel = input('Total pagado');
  protected readonly money = formatArs;
}
