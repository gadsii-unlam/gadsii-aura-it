import type { Order, OrderStatus, Product } from '@buffetya/shared';
import type {
  OrderRepository,
  PickupCounterRepository,
  ProductRepository,
} from '../../application/ports.js';
import type { PickupCounterState } from '../../domain/pickup-code.js';
import type { JsonFileStore } from './json-file-store.js';

/** The catalog is the committed seed; only stock toggles are stored. */
export class JsonProductRepository implements ProductRepository {
  constructor(
    private readonly store: JsonFileStore,
    private readonly seed: readonly Product[],
  ) {}

  async findAll(): Promise<Product[]> {
    const overrides = this.store.read((state) => state.productAvailability);
    return this.seed.map((product) => ({
      ...structuredClone(product),
      available: overrides[product.id] ?? product.available,
    }));
  }

  async findById(id: string): Promise<Product | undefined> {
    return (await this.findAll()).find((product) => product.id === id);
  }

  async setAvailability(id: string, available: boolean): Promise<Product | undefined> {
    if (!this.seed.some((product) => product.id === id)) return undefined;
    await this.store.update((state) => {
      state.productAvailability[id] = available;
    });
    return this.findById(id);
  }
}

export class JsonOrderRepository implements OrderRepository {
  constructor(private readonly store: JsonFileStore) {}

  async findById(id: string): Promise<Order | undefined> {
    return this.store.read((state) => state.orders[id]);
  }

  async findByStatus(statuses: readonly OrderStatus[]): Promise<Order[]> {
    return this.store.read((state) =>
      Object.values(state.orders).filter((order) => statuses.includes(order.status)),
    );
  }

  async save(order: Order): Promise<void> {
    const copy = structuredClone(order);
    await this.store.update((state) => {
      state.orders[copy.id] = copy;
    });
  }
}

export class JsonPickupCounterRepository implements PickupCounterRepository {
  constructor(private readonly store: JsonFileStore) {}

  async load(): Promise<PickupCounterState | undefined> {
    return this.store.read((state) => state.pickupCounter);
  }

  async save(counter: PickupCounterState): Promise<void> {
    await this.store.update((state) => {
      state.pickupCounter = { ...counter };
    });
  }
}
