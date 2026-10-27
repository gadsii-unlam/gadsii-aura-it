import { booleanAttribute, ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { Icon } from './icon';

/**
 * A product photo in its final 4:3 box (or a 68px square thumbnail). Sized up
 * front, so nothing shifts while it loads. If the photo cannot load, the box
 * stays as a neutral surface with a faint icon.
 */
@Component({
  selector: 'app-product-photo',
  imports: [Icon],
  template: `
    @if (src() && !failed()) {
      <img
        [src]="src()"
        [alt]="alt()"
        width="640"
        height="480"
        loading="lazy"
        decoding="async"
        (error)="failed.set(true)"
      />
    } @else {
      <svg appIcon="bag" class="photo__fallback"></svg>
    }
  `,
  host: { class: 'photo', '[class.photo--thumb]': 'thumb()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPhoto {
  readonly src = input<string | undefined>();
  readonly alt = input.required<string>();
  readonly thumb = input(false, { transform: booleanAttribute });

  /** Resets whenever the photo changes. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
