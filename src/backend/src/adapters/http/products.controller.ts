import { Controller, Get, Inject } from '@nestjs/common';
import type { Product } from '@buffetya/shared';
import { CatalogService } from '../../application/catalog.service.js';

@Controller('products')
export class ProductsController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  /** The whole menu, out-of-stock products included (they show as "SIN STOCK"). */
  @Get()
  list(): Promise<Product[]> {
    return this.catalog.listProducts();
  }
}
