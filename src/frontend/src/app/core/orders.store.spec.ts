import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Order, OrderStatus } from '@buffetya/shared';
import { LEGACY_ACTIVE_ORDER_KEY, ORDERS_KEY, OrdersStore } from './orders.store';
import { ReadyNotifier, readyNotificationText } from './ready-notifier';
import { APP_STORAGE, memoryStorage, type KeyValueStorage } from './storage';

@Component({ template: '' })
class Blank {}

const CODES: Record<string, string> = { a: 'B-001', b: 'B-002', c: 'B-003', d: 'B-004' };

const order = (id: string, status: OrderStatus): Order => ({
  id,
  pickupCode: CODES[id],
  customerName: 'Martín',
  items: [],
  totalCents: 800_000,
  status,
  paymentMethod: 'mercado_pago',
  paymentStatus: 'approved',
  estimate: { minMinutes: 12, maxMinutes: 15 },
  createdAt: '2026-10-27T21:24:00.000Z',
  paidAt: '2026-10-27T21:24:30.000Z',
});

async function setup(options: { storage?: KeyValueStorage; url?: string } = {}) {
  const storage = options.storage ?? memoryStorage();
  const notifier = { notifyReady: vi.fn().mockResolvedValue(undefined) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: APP_STORAGE, useValue: storage },
      { provide: ReadyNotifier, useValue: notifier },
    ],
  });
  const router = TestBed.inject(Router);
  if (options.url) await router.navigateByUrl(options.url);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  vi.useFakeTimers();
  const http = TestBed.inject(HttpTestingController);
  /** Answers the pending GET of each order with the given status. */
  const respond = (statuses: Record<string, OrderStatus>) => {
    for (const [id, status] of Object.entries(statuses)) {
      http.expectOne(`/api/orders/${id}`).flush(order(id, status));
    }
  };
  const poll = (statuses: Record<string, OrderStatus>) => {
    vi.advanceTimersByTime(5_000);
    respond(statuses);
  };
  const store = TestBed.inject(OrdersStore);
  return { store, storage, notifier, navigate, respond, poll, http };
}

const ids = (store: OrdersStore) => store.entries().map((entry) => entry.id);

describe('OrdersStore (several orders in progress)', () => {
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('tracks a paid order and keeps it across a reload', async () => {
    const storage = memoryStorage();
    const first = await setup({ storage });
    first.store.add(order('a', 'received'));
    expect(ids(first.store)).toEqual(['a']);

    vi.useRealTimers();
    TestBed.resetTestingModule();
    const second = await setup({ storage });
    second.respond({ a: 'preparing' });

    expect(ids(second.store)).toEqual(['a']);
    expect(second.store.orderById('a')?.status).toBe('preparing');
    expect(second.store.hasOrderInProgress()).toBe(true);
  });

  it('does not overwrite an order in progress when another one is paid', async () => {
    const { store } = await setup();
    store.add(order('a', 'preparing'));
    store.add(order('b', 'received'));

    expect(ids(store)).toEqual(['a', 'b']);
    expect(store.count()).toBe(2);
    expect(store.orderById('a')?.pickupCode).toBe('B-001');
  });

  it('follows every order and applies each change only to its own order', async () => {
    const { store, poll } = await setup();
    store.add(order('a', 'received'));
    store.add(order('b', 'received'));

    poll({ a: 'preparing', b: 'received' });

    expect(store.orderById('a')?.status).toBe('preparing');
    expect(store.orderById('b')?.status).toBe('received');
  });

  it('notifies once per order, naming its own code, and opens 06 for that order', async () => {
    const { store, poll, notifier, navigate } = await setup();
    store.add(order('a', 'received'));
    store.add(order('b', 'received'));

    poll({ a: 'ready', b: 'received' });
    poll({ a: 'ready', b: 'ready' });
    poll({ a: 'ready', b: 'ready' });

    const notified = notifier.notifyReady.mock.calls.map(([o]) => readyNotificationText(o).title);
    expect(notified).toEqual(['Tu pedido B-001 está listo', 'Tu pedido B-002 está listo']);
    expect(navigate.mock.calls.map(([url]) => url)).toEqual(['/pedido/a/listo', '/pedido/b/listo']);
    expect(store.anyReady()).toBe(true);
  });

  it('notifies but does not jump to 06 while the customer is paying another order', async () => {
    const { store, poll, notifier, navigate } = await setup({ url: '/pago' });
    store.add(order('a', 'preparing'));

    poll({ a: 'ready' });

    expect(notifier.notifyReady).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('drops a delivered order, and keeps a cancelled one until it has been seen', async () => {
    const storage = memoryStorage();
    const { store, poll } = await setup({ storage });
    store.add(order('a', 'ready'));
    store.add(order('b', 'preparing'));

    poll({ a: 'delivered', b: 'cancelled' });
    expect(ids(store)).toEqual(['b']);

    store.markSeen('b');
    vi.useRealTimers();
    TestBed.resetTestingModule();
    const reopened = await setup({ storage });
    expect(ids(reopened.store)).toEqual([]);
  });

  it('forgets an order on request (its final state was shown)', async () => {
    const { store } = await setup();
    store.add(order('a', 'received'));
    store.forget('a');
    expect(ids(store)).toEqual([]);
  });

  it('migrates the single order saved by the previous version', async () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_ACTIVE_ORDER_KEY, JSON.stringify({ id: 'a', status: 'preparing' }));

    const { store, respond } = await setup({ storage });
    respond({ a: 'preparing' });

    expect(ids(store)).toEqual(['a']);
    expect(storage.getItem(LEGACY_ACTIVE_ORDER_KEY)).toBeNull();
    expect(JSON.parse(storage.getItem(ORDERS_KEY) ?? '[]')).toEqual([
      expect.objectContaining({ id: 'a', status: 'preparing' }),
    ]);
  });

  it('on start, keeps orders in progress and unseen cancellations only', async () => {
    const storage = memoryStorage();
    storage.setItem(
      ORDERS_KEY,
      JSON.stringify([
        { id: 'a', status: 'delivered' },
        { id: 'b', status: 'cancelled', seen: true },
        { id: 'c', status: 'cancelled' },
        { id: 'd', status: 'ready' },
      ]),
    );

    const { store, respond } = await setup({ storage });
    respond({ d: 'ready' });

    expect(ids(store)).toEqual(['c', 'd']);
  });

  it('shows 06 without a system notification for an order found ready when reopening', async () => {
    const storage = memoryStorage();
    storage.setItem(ORDERS_KEY, JSON.stringify([{ id: 'a', status: 'preparing' }]));

    const { respond, notifier, navigate } = await setup({ storage });
    respond({ a: 'ready' });

    expect(notifier.notifyReady).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/pedido/a/listo');
  });

  it('stops following an order the server no longer knows', async () => {
    const storage = memoryStorage();
    storage.setItem(ORDERS_KEY, JSON.stringify([{ id: 'a', status: 'preparing' }]));

    const { store, http } = await setup({ storage });
    http.expectOne('/api/orders/a').flush({ code: 'ORDER_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });

    expect(ids(store)).toEqual([]);
  });
});

describe('ready notification text', () => {
  it('carries the pickup code, as drawn in 06', () => {
    expect(readyNotificationText({ pickupCode: 'B-047' })).toEqual({
      title: 'Tu pedido B-047 está listo',
      body: 'Pasá a retirarlo por el mostrador.',
    });
  });
});
