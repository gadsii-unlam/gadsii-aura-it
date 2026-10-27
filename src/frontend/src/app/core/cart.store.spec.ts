import { TestBed } from '@angular/core/testing';
import type { Product } from '@buffetya/shared';
import { APP_STORAGE, memoryStorage, type KeyValueStorage } from './storage';
import { CART_STORAGE_KEY, CartStore, MAX_QUANTITY } from './cart.store';

const milanesa: Product = {
  id: 'milanesa-napolitana',
  name: 'Milanesa napolitana con papas',
  priceCents: 480_000,
  category: 'mains',
  dietaryTags: ['gluten_free'],
  available: true,
  prepMinutes: 12,
};
const tarta: Product = {
  id: 'tarta-verdura',
  name: 'Tarta de verdura porción',
  priceCents: 320_000,
  category: 'mains',
  dietaryTags: ['vegetarian'],
  available: true,
  prepMinutes: 8,
};

function createStore(storage: KeyValueStorage = memoryStorage()): CartStore {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: APP_STORAGE, useValue: storage }] });
  return TestBed.inject(CartStore);
}

describe('CartStore', () => {
  it('starts empty', () => {
    const cart = createStore();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.count()).toBe(0);
    expect(cart.totalCents()).toBe(0);
  });

  it('adds a product with one unit, and a second add increments it', () => {
    const cart = createStore();
    cart.add(milanesa);
    expect(cart.quantityOf(milanesa.id)).toBe(1);
    cart.add(milanesa);
    expect(cart.quantityOf(milanesa.id)).toBe(2);
    expect(cart.lines()).toHaveLength(1);
  });

  it('adds up count and total like the wireframe bar (2 productos · $8.000)', () => {
    const cart = createStore();
    cart.add(milanesa);
    cart.add(tarta);
    expect(cart.count()).toBe(2);
    expect(cart.totalCents()).toBe(800_000);
  });

  it('increments and decrements; at zero the product leaves the cart', () => {
    const cart = createStore();
    cart.add(tarta);
    cart.increment(tarta.id);
    expect(cart.quantityOf(tarta.id)).toBe(2);
    cart.decrement(tarta.id);
    cart.decrement(tarta.id);
    expect(cart.quantityOf(tarta.id)).toBe(0);
    expect(cart.isEmpty()).toBe(true);
  });

  it('caps a product at the maximum quantity', () => {
    const cart = createStore();
    cart.add(tarta);
    for (let i = 0; i < MAX_QUANTITY + 5; i += 1) cart.increment(tarta.id);
    expect(cart.quantityOf(tarta.id)).toBe(MAX_QUANTITY);
  });

  it('removes a product regardless of its quantity', () => {
    const cart = createStore();
    cart.add(milanesa);
    cart.increment(milanesa.id);
    cart.add(tarta);
    cart.remove(milanesa.id);
    expect(cart.lines().map((line) => line.productId)).toEqual([tarta.id]);
  });

  it('ignores changes to products that are not in the cart', () => {
    const cart = createStore();
    cart.increment('nope');
    cart.decrement('nope');
    cart.remove('nope');
    expect(cart.isEmpty()).toBe(true);
  });

  it('survives a reload', () => {
    const storage = memoryStorage();
    const first = createStore(storage);
    first.add(milanesa);
    first.add(tarta);
    first.increment(tarta.id);

    const reloaded = createStore(storage);

    expect(reloaded.count()).toBe(3);
    expect(reloaded.totalCents()).toBe(480_000 + 2 * 320_000);
  });

  it('clears, also in storage', () => {
    const storage = memoryStorage();
    const cart = createStore(storage);
    cart.add(milanesa);
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    expect(createStore(storage).isEmpty()).toBe(true);
  });

  it('starts empty when the stored cart is corrupt', () => {
    const storage = memoryStorage();
    storage.setItem(CART_STORAGE_KEY, '{"lines": "oops"');
    expect(createStore(storage).isEmpty()).toBe(true);
    storage.setItem(CART_STORAGE_KEY, JSON.stringify([{ productId: 1, quantity: 'x' }]));
    expect(createStore(storage).isEmpty()).toBe(true);
  });

  it('refreshes names and prices from the catalog and drops products that left the menu', () => {
    const cart = createStore();
    cart.add(milanesa);
    cart.add(tarta);

    cart.syncWithCatalog([{ ...milanesa, name: 'Milanesa napolitana', priceCents: 500_000 }]);

    expect(cart.lines()).toEqual([
      { productId: milanesa.id, name: 'Milanesa napolitana', unitPriceCents: 500_000, quantity: 1 },
    ]);
  });

  it('builds the request items for the API', () => {
    const cart = createStore();
    cart.add(milanesa);
    cart.add(tarta);
    cart.increment(tarta.id);
    expect(cart.requestItems()).toEqual([
      { productId: milanesa.id, quantity: 1 },
      { productId: tarta.id, quantity: 2 },
    ]);
  });
});
