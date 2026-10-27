import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OrdersStore } from '../core/orders.store';
import { Icon } from './icon';

/**
 * Wireframe D keeps two tabs. The second one is "Mis pedidos": several orders
 * can be in progress at once, and a badge counts them when there are two or more.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav class="tabbar" aria-label="Navegación principal">
      <a
        class="tab"
        routerLink="/"
        routerLinkActive
        ariaCurrentWhenActive="page"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        <span class="tab__icon"><svg appIcon="list"></svg></span>Menú
      </a>
      <a
        class="tab"
        routerLink="/pedido"
        routerLinkActive
        ariaCurrentWhenActive="page"
        [attr.aria-label]="badge() ? 'Mis pedidos, ' + badge() + ' en curso' : null"
      >
        <span class="tab__icon">
          <svg appIcon="package"></svg>
          @if (badge()) {
            <span class="tab__badge" aria-hidden="true">{{ badge() }}</span>
          }
        </span>
        Mis pedidos
      </a>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBar {
  private readonly orders = inject(OrdersStore);
  protected readonly badge = computed(() => (this.orders.count() >= 2 ? this.orders.count() : 0));
}
