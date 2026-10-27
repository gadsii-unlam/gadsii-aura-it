import { inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';

/** White chrome everywhere (DESIGN.md); the ready field and the backstage bar are the exceptions. */
export const THEME_DEFAULT = '#ffffff';
export const THEME_READY = '#0b7a5e';
export const THEME_BACKSTAGE = '#022410';

@Injectable({ providedIn: 'root' })
export class ThemeColor {
  private readonly meta = inject(Meta);

  set(color: string): void {
    this.meta.updateTag({ name: 'theme-color', content: color });
  }

  reset(): void {
    this.set(THEME_DEFAULT);
  }
}
