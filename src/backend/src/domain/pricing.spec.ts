import type { Product } from '@buffetya/shared';
import { DomainError } from './errors.js';
import { MAX_QUANTITY_PER_ITEM, priceItems } from './pricing.js';

const product = (overrides: Partial<Product> & Pick<Product, 'id'>): Product => ({
  name: overrides.id,
  priceCents: 100_000,
  category: 'mains',
  dietaryTags: [],
  available: true,
  prepMinutes: 5,
  ...overrides,
});

const catalog = [
  product({ id: 'milanesa', name: 'Milanesa napolitana con papas', priceCents: 480_000 }),
  product({ id: 'tarta', name: 'Tarta de verdura porción', priceCents: 320_000 }),
  product({ id: 'medialunas', name: 'Medialunas x3', priceCents: 210_000, available: false }),
];

function errorOf(fn: () => unknown): DomainError {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainError) return error;
    throw error;
  }
  throw new Error('expected a DomainError');
}

describe('priceItems', () => {
  it('prices every line from the catalog and adds up the total', () => {
    const priced = priceItems(
      [
        { productId: 'milanesa', quantity: 1 },
        { productId: 'tarta', quantity: 2 },
      ],
      catalog,
    );

    expect(priced.items).toEqual([
      {
        productId: 'milanesa',
        name: 'Milanesa napolitana con papas',
        quantity: 1,
        unitPriceCents: 480_000,
        lineTotalCents: 480_000,
      },
      {
        productId: 'tarta',
        name: 'Tarta de verdura porción',
        quantity: 2,
        unitPriceCents: 320_000,
        lineTotalCents: 640_000,
      },
    ]);
    expect(priced.totalCents).toBe(1_120_000);
  });

  it('ignores any price the client may have sent', () => {
    const tampered = [{ productId: 'milanesa', quantity: 1, unitPriceCents: 1 }];
    expect(priceItems(tampered, catalog).totalCents).toBe(480_000);
  });

  it('merges repeated lines of the same product', () => {
    const priced = priceItems(
      [
        { productId: 'tarta', quantity: 1 },
        { productId: 'tarta', quantity: 2 },
      ],
      catalog,
    );
    expect(priced.items).toHaveLength(1);
    expect(priced.items[0].quantity).toBe(3);
  });

  it('rejects an empty order', () => {
    expect(errorOf(() => priceItems([], catalog)).code).toBe('INVALID_REQUEST');
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects quantity %p', (quantity) => {
    expect(errorOf(() => priceItems([{ productId: 'tarta', quantity }], catalog)).code).toBe(
      'INVALID_REQUEST',
    );
  });

  it('rejects quantities above the per-product limit, also after merging', () => {
    const over = MAX_QUANTITY_PER_ITEM + 1;
    expect(errorOf(() => priceItems([{ productId: 'tarta', quantity: over }], catalog)).code).toBe(
      'INVALID_REQUEST',
    );
    const merged = [
      { productId: 'tarta', quantity: MAX_QUANTITY_PER_ITEM },
      { productId: 'tarta', quantity: 1 },
    ];
    expect(errorOf(() => priceItems(merged, catalog)).code).toBe('INVALID_REQUEST');
  });

  it('rejects unknown products and names them', () => {
    const error = errorOf(() => priceItems([{ productId: 'caviar', quantity: 1 }], catalog));
    expect(error.code).toBe('UNKNOWN_PRODUCT');
    expect(error.productIds).toEqual(['caviar']);
  });

  it('rejects products without stock and names them', () => {
    const error = errorOf(() =>
      priceItems(
        [
          { productId: 'milanesa', quantity: 1 },
          { productId: 'medialunas', quantity: 1 },
        ],
        catalog,
      ),
    );
    expect(error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(error.productIds).toEqual(['medialunas']);
  });
});
