import {
  ACTIVE_ORDER_STATUSES,
  type CartItemRequest,
  type CreateOrderRequest,
  type Order,
  type OrderQuote,
  type OrderStatus,
  type PaymentAttempt,
  type PaymentResponse,
  type PrepEstimate,
  type Product,
} from '@buffetya/shared';
import { normalizeCustomerName } from '../domain/customer-name.js';
import { DomainError } from '../domain/errors.js';
import { estimatePreparation } from '../domain/estimate.js';
import {
  assertPayable,
  changeStatus,
  createOrder,
  recordApprovedPayment,
  recordRejectedPayment,
} from '../domain/order.js';
import { dateKeyIn, issuePickupCode } from '../domain/pickup-code.js';
import { priceItems } from '../domain/pricing.js';
import type {
  Clock,
  IdGenerator,
  OrderEventPublisher,
  OrderingSettings,
  OrderRepository,
  PaymentGateway,
  PickupCounterRepository,
  ProductRepository,
} from './ports.js';
import { SerialLock } from './serial-lock.js';

/** Orders that count as "ahead" in the kitchen for the estimate. */
const IN_KITCHEN: readonly OrderStatus[] = ['received', 'preparing'];

export interface OrderingDependencies {
  products: ProductRepository;
  orders: OrderRepository;
  counter: PickupCounterRepository;
  gateway: PaymentGateway;
  events: OrderEventPublisher;
  clock: Clock;
  ids: IdGenerator;
  settings: OrderingSettings;
}

/**
 * The ordering use cases: quote a cart, place an order, pay it, and move it
 * through the kitchen. Framework-free; Nest wires it in app.module.ts.
 */
export class OrderingService {
  /** Every write goes through here, so a double tap cannot charge twice. */
  private readonly writes = new SerialLock();

  constructor(private readonly deps: OrderingDependencies) {}

  /** Prices and estimates a cart before the customer commits money (02 · Mi carrito). */
  async quote(items: CartItemRequest[]): Promise<OrderQuote> {
    const catalog = await this.deps.products.findAll();
    const priced = priceItems(items, catalog);
    const estimate = await this.estimateFor(priced.items, catalog);
    return { ...priced, estimate };
  }

  /** Creates the order to be paid. It does not reach the kitchen yet. */
  async placeOrder(request: CreateOrderRequest): Promise<Order> {
    const customerName = normalizeCustomerName(request.customerName);
    const catalog = await this.deps.products.findAll();
    const priced = priceItems(request.items, catalog);
    const order = createOrder({
      id: this.deps.ids.next(),
      customerName,
      items: priced.items,
      totalCents: priced.totalCents,
      estimate: await this.estimateFor(priced.items, catalog),
      createdAt: this.deps.clock.now(),
    });
    await this.deps.orders.save(order);
    this.deps.events.publish(order);
    return order;
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.deps.orders.findById(id);
    if (!order) {
      throw new DomainError('ORDER_NOT_FOUND', 'No encontramos ese pedido.');
    }
    return order;
  }

  /**
   * Charges the order through the payment gateway. Approved: the order enters
   * the kitchen with its pickup code. Rejected: nothing changes but the record
   * of the attempt, so the customer can retry with the same cart.
   */
  pay(orderId: string): Promise<PaymentResponse> {
    return this.writes.run(async () => {
      const order = await this.getOrder(orderId);
      assertPayable(order);

      // Never charge for something the kitchen cannot make any more.
      const catalog = await this.deps.products.findAll();
      priceItems(
        order.items.map(({ productId, quantity }) => ({ productId, quantity })),
        catalog,
      );

      const outcome = await this.deps.gateway.charge({
        orderId: order.id,
        amountCents: order.totalCents,
        customerName: order.customerName,
      });
      const attempt = this.attempt(outcome.result, outcome.reference);

      let updated: Order;
      if (outcome.result === 'rejected') {
        updated = recordRejectedPayment(order, attempt);
      } else {
        const paidAt = new Date(attempt.at);
        const issued = issuePickupCode(
          await this.deps.counter.load(),
          dateKeyIn(this.deps.settings.timeZone, paidAt),
        );
        await this.deps.counter.save(issued.state);
        updated = recordApprovedPayment(order, {
          attempt,
          pickupCode: issued.code,
          estimate: await this.estimateFor(order.items, catalog),
        });
      }

      await this.deps.orders.save(updated);
      this.deps.events.publish(updated);
      return { result: outcome.result, processedAt: attempt.at, order: updated };
    });
  }

  /** A status change made by the buffet. */
  changeStatus(orderId: string, to: OrderStatus): Promise<Order> {
    return this.writes.run(async () => {
      const order = await this.getOrder(orderId);
      const updated = changeStatus(order, to, this.deps.clock.now(), {
        pickupHoldMinutes: this.deps.settings.pickupHoldMinutes,
      });
      await this.deps.orders.save(updated);
      this.deps.events.publish(updated);
      return updated;
    });
  }

  /** What the kitchen has to do or hand over, oldest payment first. */
  async listActive(): Promise<Order[]> {
    const orders = await this.deps.orders.findByStatus(ACTIVE_ORDER_STATUSES);
    return orders.sort((a, b) => (a.paidAt ?? a.createdAt).localeCompare(b.paidAt ?? b.createdAt));
  }

  private async estimateFor(
    items: readonly { productId: string }[],
    catalog: readonly Product[],
  ): Promise<PrepEstimate> {
    const prepById = new Map(catalog.map((product) => [product.id, product.prepMinutes]));
    const ahead = await this.deps.orders.findByStatus(IN_KITCHEN);
    return estimatePreparation(
      items.map((item) => prepById.get(item.productId) ?? 0),
      ahead.length,
    );
  }

  private attempt(result: PaymentAttempt['result'], reference: string): PaymentAttempt {
    return {
      result,
      method: 'mercado_pago',
      at: this.deps.clock.now().toISOString(),
      reference,
    };
  }
}
