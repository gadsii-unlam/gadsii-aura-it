import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiClient, apiErrorOf } from '../core/api.client';
import { CartStore } from '../core/cart.store';
import { CatalogStore } from '../core/catalog.store';
import { CustomerStore, MAX_NAME_LENGTH } from '../core/customer.store';
import { formatArs } from '../core/format';
import { Icon } from '../ui/icon';

/**
 * 03 · Pago ("Paso 2 de 2"). Only a name — no account, no email, no password —
 * and Mercado Pago preselected. The button says where it takes you.
 */
@Component({
  selector: 'app-payment-page',
  imports: [RouterLink, Icon],
  template: `
    <main class="phone">
      <header class="appbar">
        <a class="iconbtn" routerLink="/carrito" aria-label="Volver a mi carrito"><svg appIcon="arrowLeft"></svg></a>
        <div class="appbar__grow">
          <h1 class="appbar__title">Pago</h1>
          <p class="appbar__sub">Paso 2 de 2</p>
        </div>
      </header>

      <form id="pay-form" class="screen screen--dock" novalidate (submit)="pay($event)">
        <div class="section">
          <div class="field">
            <label class="field__label" for="customer-name">¿A nombre de quién?</label>
            <input
              #nameInput
              id="customer-name"
              class="input"
              name="customerName"
              type="text"
              placeholder="Nombre"
              autocomplete="given-name"
              autocapitalize="words"
              enterkeyhint="go"
              [attr.maxlength]="maxName"
              [value]="customer.name()"
              [attr.aria-invalid]="nameError() ? 'true' : null"
              aria-describedby="customer-name-hint customer-name-error"
              (input)="onName($any($event.target).value)"
            />
            <p class="field__hint" id="customer-name-hint">Lo usamos para avisarte cuando esté listo.</p>
            @if (nameError()) {
              <p class="field__error" id="customer-name-error" role="alert">
                <svg appIcon="alert"></svg>{{ nameError() }}
              </p>
            }
          </div>
        </div>

        <div class="section">
          <div class="section__head"><h2 class="section__title" id="method-title">Medio de pago</h2></div>
        </div>
        <div class="card card--inset optlist" role="radiogroup" aria-labelledby="method-title">
          <label class="opt">
            <input type="radio" name="method" value="mercado_pago" checked />
            <span class="opt__dot"></span>
            <span class="opt__grow">
              <span class="opt__name">Mercado Pago</span>
              <span class="opt__meta">Dinero en cuenta, débito o crédito</span>
            </span>
            <span class="opt__mark"><svg appIcon="card"></svg></span>
          </label>
        </div>

        <div class="card card--inset" style="margin-top: var(--s4)">
          <div class="sum">
            <div class="sum__total"><span>Total a pagar</span><b>{{ money(cart.totalCents()) }}</b></div>
          </div>
        </div>

        @if (submitError()) {
          <div class="pad4">
            <div class="notice notice--alert" role="alert">
              <svg appIcon="alert"></svg>
              <div class="notice__body">
                <span>{{ submitError() }}</span>
                @if (stockProblem()) {
                  <a routerLink="/carrito">Revisar mi carrito</a>
                }
              </div>
            </div>
          </div>
        }
      </form>

      <div class="dock">
        <button
          class="btn btn--primary btn--block"
          type="submit"
          form="pay-form"
          [attr.data-loading]="submitting() ? 'true' : null"
          [attr.aria-busy]="submitting()"
        >
          ¡PAGAR con Mercado Pago!
        </button>
        <p class="dock__note">¡Te notificamos cuando esté listo para retirar!</p>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPage implements OnInit {
  protected readonly cart = inject(CartStore);
  protected readonly customer = inject(CustomerStore);
  private readonly catalog = inject(CatalogStore);
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly maxName = MAX_NAME_LENGTH;
  protected readonly money = formatArs;
  protected readonly nameError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly stockProblem = signal(false);
  protected readonly submitting = signal(false);

  ngOnInit(): void {
    if (this.cart.isEmpty()) void this.router.navigateByUrl('/carrito', { replaceUrl: true });
  }

  protected onName(value: string): void {
    this.customer.setName(value);
    if (this.nameError() && value.trim()) this.nameError.set(null);
  }

  protected pay(event: Event): void {
    event.preventDefault();
    if (this.submitting()) return;

    const customerName = this.customer.name().trim();
    if (!customerName) {
      this.nameError.set('Escribí un nombre para el pedido.');
      this.nameInput().nativeElement.focus();
      return;
    }
    if (this.cart.isEmpty()) {
      void this.router.navigateByUrl('/carrito');
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.stockProblem.set(false);
    this.api.createOrder({ customerName, items: this.cart.requestItems() }).subscribe({
      next: (order) => {
        this.submitting.set(false);
        void this.router.navigate(['/checkout', order.id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const apiError = apiErrorOf(error);
        if (apiError?.code === 'PRODUCT_UNAVAILABLE' || apiError?.code === 'UNKNOWN_PRODUCT') {
          this.stockProblem.set(true);
          this.submitError.set('Uno de los productos se quedó sin stock. No se te cobró nada.');
          this.catalog.load();
        } else if (apiError?.code === 'INVALID_REQUEST') {
          this.submitError.set(apiError.message);
        } else {
          this.submitError.set('No pudimos conectar con el buffet. Probá de nuevo en unos segundos.');
        }
      },
    });
  }
}
