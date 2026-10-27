import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Order, OrderQuote, PaymentResponse } from '@buffetya/shared';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { OrderingService } from '../../application/ordering.service.js';
import { ORDER_EVENTS } from '../../application/ports.js';
import { parseCartItems, parseCreateOrder, parseOrderIds } from '../../application/requests.js';
import type { InMemoryOrderEvents } from '../events/in-memory-order-events.js';

/** Keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 20_000;

/**
 * Server-Sent Events: the current state of every order right away, then each
 * change. The frontend falls back to polling GET /orders/:id if it drops.
 */
function openEventStream(
  request: Request,
  response: Response,
  snapshot: readonly Order[],
  changes: Observable<Order>,
): void {
  response.status(200);
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');
  response.flushHeaders();

  const send = (order: Order) => response.write(`data: ${JSON.stringify(order)}\n\n`);
  response.write('retry: 3000\n\n');
  snapshot.forEach(send);

  const subscription = changes.subscribe({ next: send, complete: () => response.end() });
  const heartbeat = setInterval(() => response.write(': ping\n\n'), HEARTBEAT_MS);
  request.on('close', () => {
    clearInterval(heartbeat);
    subscription.unsubscribe();
  });
}

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(OrderingService) private readonly ordering: OrderingService,
    @Inject(ORDER_EVENTS) private readonly events: InMemoryOrderEvents,
  ) {}

  /** Prices and estimates a cart without creating anything (02 · Mi carrito). */
  @Post('quote')
  @HttpCode(200)
  quote(@Body() body: unknown): Promise<OrderQuote> {
    return this.ordering.quote(parseCartItems(body));
  }

  /** Creates the order to be paid (03 · Pago). It does not reach the kitchen yet. */
  @Post()
  create(@Body() body: unknown): Promise<Order> {
    return this.ordering.placeOrder(parseCreateOrder(body));
  }

  /**
   * One stream for every order a device follows (`?ids=a,b`), so several
   * orders in progress do not each hold a connection. Unknown ids are skipped.
   * Declared before `:id` so "events" is never read as an order id.
   */
  @Get('events')
  async streamMany(@Query('ids') ids: unknown, @Req() request: Request, @Res() response: Response) {
    const wanted = parseOrderIds(ids);
    const found = await Promise.all(wanted.map((id) => this.ordering.getOrder(id).catch(() => undefined)));
    const orders = found.filter((order): order is Order => order !== undefined);
    openEventStream(request, response, orders, this.events.changesOfAny(orders.map((order) => order.id)));
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Order> {
    return this.ordering.getOrder(id);
  }

  /** The Mercado Pago checkout submits here. A rejection is a 200 with result "rejected". */
  @Post(':id/payments')
  @HttpCode(200)
  pay(@Param('id') id: string): Promise<PaymentResponse> {
    return this.ordering.pay(id);
  }

  /** Live changes of a single order. */
  @Get(':id/events')
  async stream(@Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    // Throws ORDER_NOT_FOUND as a normal JSON 404 before any stream opens.
    const order = await this.ordering.getOrder(id);
    openEventStream(request, response, [order], this.events.changesOf(id));
  }
}
