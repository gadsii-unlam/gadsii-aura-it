import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Product } from '@buffetya/shared';
import { APP_STORAGE, memoryStorage } from '../core/storage';
import { MenuPage } from './menu.page';

const menu: Product[] = [
  {
    id: 'milanesa-napolitana',
    imageUrl: '/products/milanesa-napolitana.jpg',
    name: 'Milanesa napolitana con papas',
    priceCents: 480_000,
    category: 'mains',
    dietaryTags: ['gluten_free'],
    available: true,
    prepMinutes: 12,
  },
  {
    id: 'tarta-verdura',
    imageUrl: '/products/tarta-verdura.jpg',
    name: 'Tarta de verdura porción',
    priceCents: 320_000,
    category: 'mains',
    dietaryTags: ['vegetarian'],
    available: true,
    prepMinutes: 8,
  },
  {
    id: 'medialunas-x3',
    imageUrl: '/products/medialunas-x3.jpg',
    name: 'Medialunas x3',
    priceCents: 210_000,
    category: 'bakery',
    dietaryTags: [],
    available: false,
    prepMinutes: 2,
  },
];

async function renderMenu() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: APP_STORAGE, useValue: memoryStorage() },
    ],
  });
  const fixture = TestBed.createComponent(MenuPage);
  await fixture.whenStable();
  TestBed.inject(HttpTestingController).expectOne('/api/products').flush(menu);
  await fixture.whenStable();

  const element = fixture.nativeElement as HTMLElement;
  const card = (name: string) =>
    [...element.querySelectorAll<HTMLElement>('app-product-card')].find((candidate) =>
      candidate.textContent?.includes(name),
    ) as HTMLElement;
  const press = async (label: string) => {
    element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)?.click();
    await fixture.whenStable();
  };
  const cartBar = () => element.querySelector('.cartbar');
  return { fixture, element, card, press, cartBar };
}

describe('MenuPage', () => {
  it('lists the whole menu with prices, no login in front of it', async () => {
    const { element } = await renderMenu();
    expect(element.textContent).toContain('BuffetYa!');
    expect(element.textContent).toContain('Buffet Central');
    expect(element.querySelectorAll('app-product-card')).toHaveLength(3);
    expect(element.textContent).toContain('$4.800');
  });

  it('adds with "+", corrects with "− 1 +" on the card, and drops the product at zero', async () => {
    const { card, press, cartBar } = await renderMenu();
    expect(cartBar()).toBeNull();

    await press('Agregar Milanesa napolitana con papas');
    expect(card('Milanesa').querySelector('output')?.textContent?.trim()).toBe('1');

    await press('Agregar Tarta de verdura porción');
    expect(cartBar()?.textContent).toContain('2 productos · $8.000');
    expect(cartBar()?.textContent).toContain('Ver mi carrito');

    await press('Agregar uno de Milanesa napolitana con papas');
    expect(card('Milanesa').querySelector('output')?.textContent?.trim()).toBe('2');

    await press('Quitar uno de Milanesa napolitana con papas');
    await press('Quitar uno de Milanesa napolitana con papas');
    expect(card('Milanesa').querySelector('output')).toBeNull();
    expect(card('Milanesa').querySelector('button[aria-label="Agregar Milanesa napolitana con papas"]')).not.toBeNull();
    expect(cartBar()?.textContent).toContain('1 producto · $3.200');
  });

  it('reads as a real menu: photos, and no demo or simulation wording', async () => {
    const { element } = await renderMenu();
    expect(element.querySelectorAll('img')).toHaveLength(3);
    const wording = [
      element.textContent ?? '',
      ...[...element.querySelectorAll('[aria-label],[alt],[placeholder],[title]')].flatMap((node) =>
        ['aria-label', 'alt', 'placeholder', 'title'].map((name) => node.getAttribute(name) ?? ''),
      ),
    ].join(' ');
    expect(wording).not.toMatch(/demo|simulad|simulac|prueba|mock|fake|ficticio/i);
  });

  it('shows the out-of-stock product marked and without the add action', async () => {
    const { card } = await renderMenu();
    const medialunas = card('Medialunas x3');
    expect(medialunas.textContent).toContain('SIN STOCK');
    expect(medialunas.querySelector('button')).toBeNull();
  });

  it('narrows the list with the optional dietary filters', async () => {
    const { fixture, element } = await renderMenu();
    const chip = [...element.querySelectorAll<HTMLButtonElement>('.chip')].find(
      (candidate) => candidate.textContent?.trim() === 'Vegetariano',
    );
    chip?.click();
    await fixture.whenStable();

    expect(chip?.getAttribute('aria-pressed')).toBe('true');
    const names = [...element.querySelectorAll('app-product-card')].map((c) => c.textContent);
    expect(names).toHaveLength(1);
    expect(names[0]).toContain('Tarta de verdura porción');
  });
});
