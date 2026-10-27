import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * An authored icon from the sprite in index.html: `<svg appIcon="plus"></svg>`.
 * Decorative by default; the control that holds it carries the label.
 */
@Component({
  selector: 'svg[appIcon]',
  template: '<svg:use [attr.href]="href()" />',
  host: { 'aria-hidden': 'true', focusable: 'false' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly appIcon = input.required<string>();
  protected readonly href = computed(() => `#i-${this.appIcon()}`);
}
