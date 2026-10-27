import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PICKUP_POINT_NAME, type DietaryTag } from '@buffetya/shared';
import { OrdersStore } from '../core/orders.store';
import { CartStore } from '../core/cart.store';
import { CatalogStore } from '../core/catalog.store';
import { formatArs, formatDayLabel, formatProductCount } from '../core/format';
import { CATEGORY_CHIPS, DIET_CHIPS, filterProducts, type CategoryFilter } from '../core/menu-filter';
import { Icon } from '../ui/icon';
import { ProductCard } from '../ui/product-card';
import { TabBar } from '../ui/tab-bar';

/** 01 · Menú y precios. Opens straight away: no account, no login in front of the menu. */
@Component({
  selector: 'app-menu-page',
  imports: [RouterLink, Icon, ProductCard, TabBar],
  template: `
    <main class="phone">
      <header class="appbar">
        <div class="appbar__grow">
          <h1 class="appbar__title">BuffetYa!</h1>
          <p class="appbar__sub">{{ pickupPoint }}</p>
        </div>
        <a class="iconbtn" routerLink="/pedido" [attr.aria-label]="statusLabel()">
          <svg appIcon="bell"></svg>
          @if (orderReady()) {
            <span class="iconbtn__dot"></span>
          }
        </a>
      </header>

      <div class="screen" [class.screen--cartbar]="!cart.isEmpty()">
        <div class="searchband">
          <div class="inputwrap">
            <input
              class="input"
              type="search"
              placeholder="Buscar en el menú"
              aria-label="Buscar en el menú"
              autocomplete="off"
              enterkeyhint="search"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
            <span class="inputwrap__act"><svg appIcon="search"></svg></span>
          </div>
        </div>

        <div class="chiprow chiprow--sticky">
          <div class="chiprow__scroll" role="group" aria-label="Categorías">
            @for (chip of categories; track chip.id) {
              <button
                class="chip"
                type="button"
                [attr.aria-pressed]="category() === chip.id"
                (click)="category.set(chip.id)"
              >
                {{ chip.label }}
              </button>
            }
          </div>
        </div>
        <div class="chiprow chiprow--diet">
          <div class="chiprow__scroll" role="group" aria-label="Filtros alimenticios (opcionales)">
            @for (chip of diets; track chip.id) {
              <button
                class="chip"
                type="button"
                [attr.aria-pressed]="selectedDiets().includes(chip.id)"
                (click)="toggleDiet(chip.id)"
              >
                <svg [appIcon]="chip.icon"></svg>{{ chip.label }}
              </button>
            }
          </div>
        </div>

        <section class="section" aria-labelledby="today-title">
          <div class="section__head">
            <h2 class="section__title" id="today-title">Hoy en el buffet</h2>
            <span class="sm muted">{{ today }}</span>
          </div>
        </section>

        @switch (catalog.state()) {
          @case ('error') {
            <div class="empty" role="alert">
              <span class="empty__icon"><svg appIcon="alert"></svg></span>
              <h3 class="empty__title">No pudimos cargar el menú</h3>
              <p class="empty__text">Revisá tu conexión y probá de nuevo.</p>
              <button class="btn btn--ghost" type="button" (click)="catalog.load()">
                <svg appIcon="refresh"></svg>Reintentar
              </button>
            </div>
          }
          @default {
            @if (catalog.products().length === 0) {
              <p class="empty__text pad4" aria-live="polite">Cargando el menú…</p>
            } @else if (visible().length === 0) {
              <div class="empty">
                <span class="empty__icon"><svg appIcon="search"></svg></span>
                <h3 class="empty__title">No hay productos con esos filtros</h3>
                <p class="empty__text">Probá con otra búsqueda o sacá algún filtro.</p>
                <button class="btn btn--ghost" type="button" (click)="resetFilters()">Ver todo el menú</button>
              </div>
            } @else {
              <div class="grid">
                @for (product of visible(); track product.id) {
                  <app-product-card
                    [product]="product"
                    [quantity]="cart.quantityOf(product.id)"
                    (add)="cart.add(product)"
                    (increment)="cart.increment(product.id)"
                    (decrement)="cart.decrement(product.id)"
                  />
                }
              </div>
            }
          }
        }
      </div>

      @if (!cart.isEmpty()) {
        <a class="cartbar" routerLink="/carrito">
          <span class="cartbar__sum">{{ cartSummary() }}</span>
          <span class="cartbar__cta">Ver mi carrito<svg appIcon="chevronRight"></svg></span>
        </a>
      }

      <app-tab-bar />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  protected readonly cart = inject(CartStore);
  protected readonly catalog = inject(CatalogStore);
  private readonly orders = inject(OrdersStore);

  protected readonly pickupPoint = PICKUP_POINT_NAME;
  protected readonly categories = CATEGORY_CHIPS;
  protected readonly diets = DIET_CHIPS;
  protected readonly today = formatDayLabel(new Date());

  protected readonly query = signal('');
  protected readonly category = signal<CategoryFilter>('all');
  protected readonly selectedDiets = signal<DietaryTag[]>([]);

  protected readonly visible = computed(() =>
    filterProducts(this.catalog.products(), {
      query: this.query(),
      category: this.category(),
      diets: this.selectedDiets(),
    }),
  );
  protected readonly cartSummary = computed(
    () => `${formatProductCount(this.cart.count())} · ${formatArs(this.cart.totalCents())}`,
  );
  protected readonly orderReady = computed(() => this.orders.anyReady());
  protected readonly statusLabel = computed(() =>
    this.orderReady() ? 'Mis pedidos: hay uno listo para retirar' : 'Mis pedidos',
  );

  ngOnInit(): void {
    this.catalog.load();
  }

  protected toggleDiet(diet: DietaryTag): void {
    this.selectedDiets.update((current) =>
      current.includes(diet) ? current.filter((item) => item !== diet) : [...current, diet],
    );
  }

  protected resetFilters(): void {
    this.query.set('');
    this.category.set('all');
    this.selectedDiets.set([]);
  }
}
