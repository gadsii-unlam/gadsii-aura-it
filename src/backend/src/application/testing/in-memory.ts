import type { Order, OrderStatus, Product } from '@buffetya/shared';
import type { PickupCounterState } from '../../domain/pickup-code.js';
import type {
  ChargeOutcome,
  ChargeRequest,
  Clock,
  IdGenerator,
  OrderEventPublisher,
  OrderRepository,
  PaymentGateway,
  PickupCounterRepository,
  ProductRepository,
} from '../ports.js';

/** Test doubles for the application ports. Not part of the production build. */

export class InMemoryProducts implements ProductRepository {
  private readonly products: Map<string, Product>;

  constructor(products: Product[]) {
    this.products = new Map(products.map((product) => [product.id, { ...product }]));
  }

  async findAll(): Promise<Product[]> {
    return [...this.products.values()].map((product) => ({ ...product }));
  }

  async findById(id: string): Promise<Product | undefined> {
    const product = this.products.get(id);
    return product && { ...product };
  }

  async setAvailability(id: string, available: boolean): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    product.available = available;
    return { ...product };
  }
}

export class InMemoryOrders implements OrderRepository {
  readonly orders = new Map<string, Order>();

  async findById(id: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    return order && structuredClone(order);
  }

  async findByStatus(statuses: readonly OrderStatus[]): Promise<Order[]> {
    return [...this.orders.values()]
      .filter((order) => statuses.includes(order.status))
      .map((order) => structuredClone(order));
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, structuredClone(order));
  }
}

export class InMemoryPickupCounter implements PickupCounterRepository {
  state: PickupCounterState | undefined;

  async load(): Promise<PickupCounterState | undefined> {
    return this.state && { ...this.state };
  }

  async save(state: PickupCounterState): Promise<void> {
    this.state = { ...state };
  }
}

/** Answers with a scripted list of results, then approves. */
export class ScriptedGateway implements PaymentGateway {
  readonly charges: ChargeRequest[] = [];

  constructor(private readonly script: ChargeOutcome['result'][] = []) {}

  async charge(request: ChargeRequest): Promise<ChargeOutcome> {
    this.charges.push(request);
    const result = this.script.shift() ?? 'approved';
    return { result, reference: `TEST-${this.charges.length}` };
  }
}

export class RecordingEvents implements OrderEventPublisher {
  readonly published: Order[] = [];

  publish(order: Order): void {
    this.published.push(structuredClone(order));
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current);
  }

  advance(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export class SequentialIds implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `order-${this.counter}`;
  }
}

export const product = (overrides: Partial<Product> & Pick<Product, 'id'>): Product => ({
  name: overrides.id,
  priceCents: 100_000,
  category: 'mains',
  dietaryTags: [],
  available: true,
  prepMinutes: 5,
  ...overrides,
});
