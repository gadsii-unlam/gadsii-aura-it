import { readFile } from 'node:fs/promises';
import type { DietaryTag, Product, ProductCategory } from '@buffetya/shared';

const CATEGORIES: readonly ProductCategory[] = ['mains', 'sandwiches', 'drinks', 'bakery'];
const TAGS: readonly DietaryTag[] = ['gluten_free', 'vegetarian', 'vegan'];
/** A path on the web app itself, e.g. /products/milanesa-napolitana.jpg. */
const IMAGE_PATH = /^\/[A-Za-z0-9/_-]+\.(jpg|jpeg|png|webp)$/;

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p['id'] === 'string' &&
    p['id'].length > 0 &&
    typeof p['name'] === 'string' &&
    p['name'].length > 0 &&
    Number.isInteger(p['priceCents']) &&
    (p['priceCents'] as number) > 0 &&
    CATEGORIES.includes(p['category'] as ProductCategory) &&
    Array.isArray(p['dietaryTags']) &&
    p['dietaryTags'].every((tag) => TAGS.includes(tag as DietaryTag)) &&
    typeof p['available'] === 'boolean' &&
    Number.isInteger(p['prepMinutes']) &&
    (p['prepMinutes'] as number) >= 0 &&
    (p['imageUrl'] === undefined || (typeof p['imageUrl'] === 'string' && IMAGE_PATH.test(p['imageUrl'])))
  );
}

/**
 * Reads the menu (data/seed/products.json). There is no real buffet menu yet,
 * so the seed is hand-written; photos live in frontend/public/products
 * (sources in its CREDITS.md).
 */
export async function loadProductSeed(path: string | URL): Promise<Product[]> {
  const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid product seed at ${String(path)}: expected an array`);
  }
  const invalid = parsed.findIndex((entry) => !isProduct(entry));
  if (invalid >= 0) {
    throw new Error(`Invalid product seed at ${String(path)}: entry ${invalid} is malformed`);
  }
  const ids = new Set(parsed.map((product: Product) => product.id));
  if (ids.size !== parsed.length) {
    throw new Error(`Invalid product seed at ${String(path)}: duplicated product ids`);
  }
  return parsed as Product[];
}
