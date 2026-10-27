import type { PaymentResult } from '@buffetya/shared';
import { DomainError } from '../domain/errors.js';
import { OrderingService } from './ordering.service.js';
import {
  FixedClock,
  InMemoryOrders,
  InMemoryPickupCounter,
  InMemoryProducts,
  RecordingEvents,
  ScriptedGateway,
  SequentialIds,
  product,
} from './testing/in-memory.js';

// 18:24 in Buenos Aires, as in the wireframe.
const NOW = new Date('2026-10-25T21:24:00Z');

function setup(script: PaymentResult[] = []) {
  const products = new InMemoryProducts([
    product({ id: 'milanesa', name: 'Milanesa napolitana con papas', priceCents: 480_000, prepMinutes: 12 }),
    product({ id: 'tarta', name: 'Tarta de verdura porción', priceCents: 320_000, prepMinutes: 8 }),
    product({ id: 'medialunas', name: 'Medialunas x3', priceCents: 210_000, available: false }),
  ]);
  const orders = new InMemoryOrders();
  const counter = new InMemoryPickupCounter();
  const gateway = new ScriptedGateway(script);
  const events = new RecordingEvents();
  const clock = new FixedClock(NOW);
  const service = new OrderingService({
    products,
    orders,
    counter,
    gateway,
    events,
    clock,
    ids: new SequentialIds(),
    settings: { timeZone: 'America/Argentina/Buenos_Aires', pickupHoldMinutes: 15 },
  });
  return { service, products, orders, counter, gateway, events, clock };
}

const wireframeCart = [
  { productId: 'milanesa', quantity: 1 },
  { productId: 'tarta', quantity: 1 },
];

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
  throw new Error('expected a DomainError');
}

describe('OrderingService', () => {
  describe('quote', () => {
    it('prices the cart and estimates the wait before paying', async () => {
      const { service } = setup();
      const quote = await service.quote(wireframeCart);
      expect(quote.totalCents).toBe(800_000);
      expect(quote.estimate).toEqual({ minMinutes: 12, maxMinutes: 15 });
    });

    it('counts the orders already in the kitchen', async () => {
      const { service } = setup();
      for (let i = 0; i < 2; i += 1) {
        const order = await service.placeOrder({ customerName: `Cliente ${i}`, items: wireframeCart });
        await service.pay(order.id);
      }
      const quote = await service.quote(wireframeCart);
      expect(quote.estimate).toEqual({ minMinutes: 16, maxMinutes: 20 });
    });
  });

  describe('placeOrder', () => {
    it('creates an unpaid order with server-side prices', async () => {
      const { service, orders } = setup();
      const order = await service.placeOrder({ customerName: '  Martín ', items: wireframeCart });

      expect(order.status).toBe('awaiting_payment');
      expect(order.customerName).toBe('Martín');
      expect(order.totalCents).toBe(800_000);
      expect(order.pickupCode).toBeUndefined();
      expect(await orders.findById(order.id)).toEqual(order);
    });

    it('does not put the order in the kitchen', async () => {
      const { service } = setup();
      await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      expect(await service.listActive()).toEqual([]);
    });

    it('rejects an empty name', async () => {
      const { service } = setup();
      expect(await codeOf(service.placeOrder({ customerName: ' ', items: wireframeCart }))).toBe(
        'INVALID_REQUEST',
      );
    });

    it('rejects products without stock', async () => {
      const { service } = setup();
      const items = [{ productId: 'medialunas', quantity: 1 }];
      expect(await codeOf(service.placeOrder({ customerName: 'Martín', items }))).toBe(
        'PRODUCT_UNAVAILABLE',
      );
    });
  });

  describe('pay', () => {
    it('an approved payment sends the order to the kitchen with the first code of the day', async () => {
      const { service, events } = setup(['approved']);
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });

      const payment = await service.pay(order.id);

      expect(payment.result).toBe('approved');
      expect(payment.order.status).toBe('received');
      expect(payment.order.pickupCode).toBe('B-001');
      expect(payment.order.paidAt).toBe(NOW.toISOString());
      expect(await service.listActive()).toEqual([payment.order]);
      expect(events.published.at(-1)?.status).toBe('received');
    });

    it('charges the server-side total, never the client one', async () => {
      const { service, gateway } = setup();
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      await service.pay(order.id);
      expect(gateway.charges).toEqual([
        { orderId: order.id, amountCents: 800_000, customerName: 'Martín' },
      ]);
    });

    it('a rejected payment keeps the order unpaid and out of the kitchen', async () => {
      const { service, counter } = setup(['rejected']);
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });

      const payment = await service.pay(order.id);

      expect(payment.result).toBe('rejected');
      expect(payment.order.status).toBe('awaiting_payment');
      expect(payment.order.paymentStatus).toBe('rejected');
      expect(payment.order.pickupCode).toBeUndefined();
      expect(await service.listActive()).toEqual([]);
      expect(counter.state).toBeUndefined();
    });

    it('can be retried after a rejection', async () => {
      const { service } = setup(['rejected', 'approved']);
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      await service.pay(order.id);

      const retry = await service.pay(order.id);

      expect(retry.result).toBe('approved');
      expect(retry.order.status).toBe('received');
      expect(retry.order.pickupCode).toBe('B-001');
    });

    it('refuses to charge an order twice', async () => {
      const { service, gateway } = setup();
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      await service.pay(order.id);

      expect(await codeOf(service.pay(order.id))).toBe('PAYMENT_NOT_ALLOWED');
      expect(gateway.charges).toHaveLength(1);
    });

    it('serializes concurrent payments of the same order', async () => {
      const { service, gateway } = setup();
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });

      const outcomes = await Promise.allSettled([service.pay(order.id), service.pay(order.id)]);

      expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
      expect(gateway.charges).toHaveLength(1);
    });

    it('does not charge when a product ran out after the order was created', async () => {
      const { service, products, gateway } = setup();
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      await products.setAvailability('tarta', false);

      expect(await codeOf(service.pay(order.id))).toBe('PRODUCT_UNAVAILABLE');
      expect(gateway.charges).toHaveLength(0);
    });

    it('issues sequential codes during the day and restarts the next day', async () => {
      const { service, clock } = setup();
      const codes: (string | undefined)[] = [];
      for (let i = 0; i < 3; i += 1) {
        const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
        codes.push((await service.pay(order.id)).order.pickupCode);
      }
      clock.advance(24 * 60);
      const tomorrow = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      codes.push((await service.pay(tomorrow.id)).order.pickupCode);

      expect(codes).toEqual(['B-001', 'B-002', 'B-003', 'B-001']);
    });

    it('fails for an unknown order', async () => {
      const { service } = setup();
      expect(await codeOf(service.pay('nope'))).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('changeStatus', () => {
    async function paid() {
      const context = setup();
      const order = await context.service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      await context.service.pay(order.id);
      return { ...context, orderId: order.id };
    }

    it('walks the kitchen flow and publishes every change', async () => {
      const { service, events, clock, orderId } = await paid();
      await service.changeStatus(orderId, 'preparing');
      clock.advance(7);
      const ready = await service.changeStatus(orderId, 'ready');

      expect(ready.status).toBe('ready');
      expect(ready.pickupDeadlineAt).toBe(new Date(NOW.getTime() + 22 * 60_000).toISOString());
      expect(events.published.map((order) => order.status)).toEqual([
        'awaiting_payment',
        'received',
        'preparing',
        'ready',
      ]);
    });

    it('refuses illegal transitions', async () => {
      const { service, orderId } = await paid();
      expect(await codeOf(service.changeStatus(orderId, 'delivered'))).toBe('ILLEGAL_TRANSITION');
    });

    it('refuses to move an unpaid order into the kitchen', async () => {
      const { service } = setup();
      const order = await service.placeOrder({ customerName: 'Martín', items: wireframeCart });
      expect(await codeOf(service.changeStatus(order.id, 'received'))).toBe('ILLEGAL_TRANSITION');
    });

    it('drops delivered and cancelled orders from the active list', async () => {
      const { service, orderId } = await paid();
      const other = await service.placeOrder({ customerName: 'Ana', items: wireframeCart });
      await service.pay(other.id);

      await service.changeStatus(orderId, 'cancelled');

      expect((await service.listActive()).map((order) => order.id)).toEqual([other.id]);
    });
  });

  describe('listActive', () => {
    it('lists the kitchen in payment order', async () => {
      const { service, clock } = setup();
      const ids: string[] = [];
      for (const name of ['Ana', 'Beto', 'Caro']) {
        const order = await service.placeOrder({ customerName: name, items: wireframeCart });
        await service.pay(order.id);
        ids.push(order.id);
        clock.advance(1);
      }
      expect((await service.listActive()).map((order) => order.id)).toEqual(ids);
    });
  });
});
