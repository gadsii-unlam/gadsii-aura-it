import { inject, Injectable, signal } from '@angular/core';
import { APP_STORAGE } from './storage';

const NAME_KEY = 'buffetya.customerName.v1';
export const MAX_NAME_LENGTH = 40;

/**
 * "¿A nombre de quién?" — the only personal data of the MVP. Remembered on the
 * device so "Probar de nuevo" (04b) comes back with everything filled in.
 */
@Injectable({ providedIn: 'root' })
export class CustomerStore {
  private readonly storage = inject(APP_STORAGE);
  readonly name = signal(this.storage.getItem(NAME_KEY) ?? '');

  setName(name: string): void {
    this.name.set(name);
    this.storage.setItem(NAME_KEY, name);
  }
}
