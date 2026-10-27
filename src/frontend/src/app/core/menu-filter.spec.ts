import type { Product } from '@buffetya/shared';
import { filterProducts, matchesDiet } from './menu-filter';

const p = (id: string, overrides: Partial<Product>): Product => ({
  id,
  name: id,
  priceCents: 100_000,
  category: 'mains',
  dietaryTags: [],
  available: true,
  prepMinutes: 5,
  ...overrides,
});

const menu = [
  p('milanesa', { name: 'Milanesa napolitana con papas', dietaryTags: ['gluten_free'] }),
  p('tarta', { name: 'Tarta de verdura porción', dietaryTags: ['vegetarian'] }),
  p('bowl', { name: 'Bowl de garbanzos y quinoa', dietaryTags: ['vegan', 'gluten_free'] }),
  p('sandwich', { name: 'Sándwich de milanesa completo', category: 'sandwiches' }),
  p('agua', { name: 'Agua mineral 500 ml', category: 'drinks', dietaryTags: ['gluten_free', 'vegan'] }),
  p('medialunas', { name: 'Medialunas x3', category: 'bakery', available: false }),
];

const ids = (products: Product[]) => products.map((product) => product.id);

describe('menu filters', () => {
  it('shows the whole menu by default, out-of-stock products included', () => {
    expect(ids(filterProducts(menu, { query: '', category: 'all', diets: [] }))).toEqual(ids(menu));
  });

  it('filters by category', () => {
    expect(ids(filterProducts(menu, { query: '', category: 'sandwiches', diets: [] }))).toEqual([
      'sandwich',
    ]);
  });

  it('searches by name ignoring case and accents', () => {
    expect(ids(filterProducts(menu, { query: 'SANDWICH', category: 'all', diets: [] }))).toEqual([
      'sandwich',
    ]);
    expect(ids(filterProducts(menu, { query: '  milanesa ', category: 'all', diets: [] }))).toEqual([
      'milanesa',
      'sandwich',
    ]);
  });

  it('requires every selected restriction (a celiac vegetarian needs both)', () => {
    expect(
      ids(filterProducts(menu, { query: '', category: 'all', diets: ['gluten_free', 'vegetarian'] })),
    ).toEqual(['bowl', 'agua']);
  });

  it('counts vegan products as vegetarian', () => {
    expect(matchesDiet(menu[2], ['vegetarian'])).toBe(true);
    expect(matchesDiet(menu[1], ['vegan'])).toBe(false);
  });

  it('combines search, category and restrictions', () => {
    expect(
      ids(filterProducts(menu, { query: 'agua', category: 'drinks', diets: ['vegan'] })),
    ).toEqual(['agua']);
    expect(filterProducts(menu, { query: 'agua', category: 'mains', diets: [] })).toEqual([]);
  });
});
