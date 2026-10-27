import type { Product } from '@buffetya/shared';
import { DomainError } from '../domain/errors.js';
import type { ProductRepository } from './ports.js';

/** The menu, and the one thing the buffet can change about it in the MVP: stock. */
export class CatalogService {
  constructor(private readonly products: ProductRepository) {}

  listProducts(): Promise<Product[]> {
    return this.products.findAll();
  }

  async setAvailability(productId: string, available: boolean): Promise<Product> {
    const product = await this.products.setAvailability(productId, available);
    if (!product) {
      throw new DomainError('PRODUCT_NOT_FOUND', 'Ese producto no está en el menú.', [productId]);
    }
    return product;
  }
}
