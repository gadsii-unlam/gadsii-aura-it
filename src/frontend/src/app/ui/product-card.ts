import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { DietaryTag, Product } from '@buffetya/shared';
import { formatArs } from '../core/format';
import { Icon } from './icon';
import { ProductPhoto } from './product-photo';

const TAGS: Record<DietaryTag, { label: string; className: string; icon: string }> = {
  gluten_free: { label: 'SIN TACC', className: 'tag--tacc', icon: 'wheat' },
  vegetarian: { label: 'VEGETARIANO', className: 'tag--veg', icon: 'leaf' },
  vegan: { label: 'VEGANO', className: 'tag--vgn', icon: 'sprout' },
};

/**
 * A menu card (01 · Menú). Adding and correcting happen on the card, without
 * opening the dish: "+" while the product is not in the cart, "− N +" once it
 * is. An out-of-stock product loses the add action instead of showing it
 * disabled.
 */
@Component({
  selector: 'app-product-card',
  imports: [Icon, ProductPhoto],
  template: `
    @let p = product();
    <article class="product" [class.product--out]="!p.available">
      <app-product-photo [src]="p.imageUrl" [alt]="p.name" />
      <div class="product__body">
        <h3 class="product__name">{{ p.name }}</h3>
        @if (tags().length > 0 || !p.available) {
          <div class="product__tags">
            @if (!p.available) {
              <span class="tag tag--out">SIN STOCK</span>
            }
            @for (tag of tags(); track tag.label) {
              <span class="tag" [class]="tag.className"><svg [appIcon]="tag.icon"></svg>{{ tag.label }}</span>
            }
          </div>
        }
        <div class="product__foot">
          <span class="product__price">{{ price() }}</span>
          @if (p.available && quantity() === 0) {
            <button class="addbtn" type="button" [attr.aria-label]="'Agregar ' + p.name" (click)="add.emit()">
              <svg appIcon="plus"></svg>
            </button>
          }
        </div>
        @if (p.available && quantity() > 0) {
          <div class="stepper product__stepper">
            <button type="button" [attr.aria-label]="'Quitar uno de ' + p.name" (click)="decrement.emit()">
              <svg appIcon="minus"></svg>
            </button>
            <output aria-live="polite" [attr.aria-label]="quantity() + ' en el carrito'">{{ quantity() }}</output>
            <button
              type="button"
              [attr.aria-label]="'Agregar uno de ' + p.name"
              [disabled]="quantity() >= max()"
              (click)="increment.emit()"
            >
              <svg appIcon="plus"></svg>
            </button>
          </div>
        }
      </div>
    </article>
  `,
  host: { style: 'display: block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly quantity = input(0);
  readonly max = input(20);

  readonly add = output();
  readonly increment = output();
  readonly decrement = output();

  protected readonly price = computed(() => formatArs(this.product().priceCents));
  /** A vegan product shows VEGANO only; it already implies VEGETARIANO. */
  protected readonly tags = computed(() => {
    const tags = this.product().dietaryTags;
    return tags
      .filter((tag) => !(tag === 'vegetarian' && tags.includes('vegan')))
      .map((tag) => TAGS[tag]);
  });
}
