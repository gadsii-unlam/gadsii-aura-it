import type { Order } from '@buffetya/shared';
import { filter, Observable, Subject } from 'rxjs';
import type { OrderEventPublisher } from '../../application/ports.js';

/** In-process pub/sub of order changes. Feeds the SSE stream of each order. */
export class InMemoryOrderEvents implements OrderEventPublisher {
  private readonly changes = new Subject<Order>();

  publish(order: Order): void {
    this.changes.next(structuredClone(order));
  }

  changesOf(orderId: string): Observable<Order> {
    return this.changesOfAny([orderId]);
  }

  changesOfAny(orderIds: readonly string[]): Observable<Order> {
    const ids = new Set(orderIds);
    return this.changes.pipe(filter((order) => ids.has(order.id)));
  }

  /** Nest lifecycle hook: ends every open SSE stream so shutdown is not held up. */
  onModuleDestroy(): void {
    this.changes.complete();
  }
}
