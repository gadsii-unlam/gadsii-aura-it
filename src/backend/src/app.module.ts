import { type DynamicModule, Logger, Module } from '@nestjs/common';
import type { Product } from '@buffetya/shared';
import { CatalogService } from './application/catalog.service.js';
import { OrderingService } from './application/ordering.service.js';
import {
  CLOCK,
  type Clock,
  ID_GENERATOR,
  type IdGenerator,
  ORDER_EVENTS,
  ORDER_REPOSITORY,
  type OrderEventPublisher,
  type OrderRepository,
  PAYMENT_GATEWAY,
  type PaymentGateway,
  PICKUP_COUNTER_REPOSITORY,
  type PickupCounterRepository,
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from './application/ports.js';
import { InMemoryOrderEvents } from './adapters/events/in-memory-order-events.js';
import { BackstageController } from './adapters/http/backstage.controller.js';
import { BackstageGuard } from './adapters/http/backstage.guard.js';
import { OrdersController } from './adapters/http/orders.controller.js';
import { ProductsController } from './adapters/http/products.controller.js';
import { APP_CONFIG, PRODUCT_SEED } from './adapters/http/tokens.js';
import { SimulatedPaymentGateway } from './adapters/payment/simulated-payment-gateway.js';
import { JsonFileStore } from './adapters/persistence/json-file-store.js';
import {
  JsonOrderRepository,
  JsonPickupCounterRepository,
  JsonProductRepository,
} from './adapters/persistence/json-repositories.js';
import { loadProductSeed } from './adapters/persistence/product-seed.js';
import { RandomIds, SystemClock } from './adapters/system.js';
import type { AppConfig } from './config.js';

/**
 * Composition root. Ports are bound to adapters here and only here: the JSON
 * file store and the simulated payment gateway are the MVP choices, and a
 * Firebase repository or a real Mercado Pago gateway would be swapped in by
 * changing these bindings.
 */
@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      controllers: [ProductsController, OrdersController, BackstageController],
      providers: [
        { provide: APP_CONFIG, useValue: config },
        { provide: CLOCK, useClass: SystemClock },
        { provide: ID_GENERATOR, useClass: RandomIds },
        { provide: ORDER_EVENTS, useClass: InMemoryOrderEvents },
        { provide: SimulatedPaymentGateway, useClass: SimulatedPaymentGateway },
        { provide: PAYMENT_GATEWAY, useExisting: SimulatedPaymentGateway },
        {
          provide: JsonFileStore,
          useFactory: (appConfig: AppConfig) =>
            JsonFileStore.open(appConfig.dataFile, new Logger('JsonFileStore')),
          inject: [APP_CONFIG],
        },
        {
          provide: PRODUCT_SEED,
          useFactory: (appConfig: AppConfig) => loadProductSeed(appConfig.seedFile),
          inject: [APP_CONFIG],
        },
        {
          provide: PRODUCT_REPOSITORY,
          useFactory: (store: JsonFileStore, seed: Product[]) => new JsonProductRepository(store, seed),
          inject: [JsonFileStore, PRODUCT_SEED],
        },
        {
          provide: ORDER_REPOSITORY,
          useFactory: (store: JsonFileStore) => new JsonOrderRepository(store),
          inject: [JsonFileStore],
        },
        {
          provide: PICKUP_COUNTER_REPOSITORY,
          useFactory: (store: JsonFileStore) => new JsonPickupCounterRepository(store),
          inject: [JsonFileStore],
        },
        {
          provide: CatalogService,
          useFactory: (products: ProductRepository) => new CatalogService(products),
          inject: [PRODUCT_REPOSITORY],
        },
        {
          provide: OrderingService,
          useFactory: (
            products: ProductRepository,
            orders: OrderRepository,
            counter: PickupCounterRepository,
            gateway: PaymentGateway,
            events: OrderEventPublisher,
            clock: Clock,
            ids: IdGenerator,
            appConfig: AppConfig,
          ) =>
            new OrderingService({
              products,
              orders,
              counter,
              gateway,
              events,
              clock,
              ids,
              settings: {
                timeZone: appConfig.timeZone,
                pickupHoldMinutes: appConfig.pickupHoldMinutes,
              },
            }),
          inject: [
            PRODUCT_REPOSITORY,
            ORDER_REPOSITORY,
            PICKUP_COUNTER_REPOSITORY,
            PAYMENT_GATEWAY,
            ORDER_EVENTS,
            CLOCK,
            ID_GENERATOR,
            APP_CONFIG,
          ],
        },
        BackstageGuard,
      ],
    };
  }
}
