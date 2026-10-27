import type { DietaryTag, Product } from '@buffetya/shared';

/** The category chips drawn in wireframe D, in order. */
export type CategoryFilter = 'all' | 'mains' | 'sandwiches' | 'drinks';

export const CATEGORY_CHIPS: readonly { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'mains', label: 'Minutas' },
  { id: 'sandwiches', label: 'Sándwiches' },
  { id: 'drinks', label: 'Bebidas' },
];

export const DIET_CHIPS: readonly { id: DietaryTag; label: string; icon: string }[] = [
  { id: 'gluten_free', label: 'Sin TACC', icon: 'wheat' },
  { id: 'vegetarian', label: 'Vegetariano', icon: 'leaf' },
  { id: 'vegan', label: 'Vegano', icon: 'sprout' },
];

export interface MenuFilter {
  query: string;
  category: CategoryFilter;
  diets: readonly DietaryTag[];
}

/** Lowercase, no accents: "Sándwich" matches "sandwich". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Every selected restriction must hold: a celiac vegetarian needs both.
 * A vegan product is also vegetarian.
 */
export function matchesDiet(product: Product, diets: readonly DietaryTag[]): boolean {
  return diets.every(
    (diet) =>
      product.dietaryTags.includes(diet) ||
      (diet === 'vegetarian' && product.dietaryTags.includes('vegan')),
  );
}

/**
 * The menu starts complete and the filters only narrow it (01 · note 2).
 * Out-of-stock products stay in the list, marked "SIN STOCK" (note 5).
 */
export function filterProducts(products: readonly Product[], filter: MenuFilter): Product[] {
  const query = normalizeText(filter.query);
  return products.filter(
    (product) =>
      (filter.category === 'all' || product.category === filter.category) &&
      (query === '' || normalizeText(product.name).includes(query)) &&
      matchesDiet(product, filter.diets),
  );
}
