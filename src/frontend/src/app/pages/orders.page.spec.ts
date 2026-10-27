import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Order, OrderStatus } from '@buffetya/shared';
import { ORDERS_KEY } from '../core/orders.store';
import { APP_STORAGE, memoryStorage } from '../core/storage';
import { OrdersPage } from './orders.page';

@Component({ template: '' })
class Blank {}

const order = (id: string, code: string, status: OrderStatus): Order => ({
  id,
  pickupCode: code,
  customerName: 'Martín',
  items: [
    { productId: 'tarta-verdura', name: 'Tarta de verdura porción', quantity: 2, unitPriceCents: 320_000, lineTotalCents: 640_000 },
  ],
  totalCents: 640_000,
  status,
  paymentMethod: 'mercado_pago',
  paymentStatus: 'approved',
  estimate: { minMinutes: 12, maxMinutes: 15 },
  createdAt: '2026-10-27T21:24:00.000Z',
  paidAt: '2026-10-27T21:24:30.000Z',
});

async function render(orders: Order[]) {
  const storage = memoryStorage();
  storage.setItem(
    ORDERS_KEY,
    JSON.stringify(orders.map(({ id, status, pickupCode }) => ({ id, status, pickupCode }))),
  );
  TestBed.configureTestingModule({
    providers: [
      // The store opens 06 by itself for an order found ready.
      provideRouter([{ path: '**', component: Blank }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: APP_STORAGE, useValue: storage },
    ],
  });
  const fixture = TestBed.createComponent(OrdersPage);
  await fixture.whenStable();
  const http = TestBed.inject(HttpTestingController);
  for (const current of orders) {
    for (const request of http.match(`/api/orders/${current.id}`)) request.flush(current);
  }
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const rows = () => [...element.querySelectorAll<HTMLAnchorElement>('.ordercard')];
  return { element, rows };
}

describe('OrdersPage ("Mis pedidos")', () => {
  it('with no order, shows the empty state and a way to the menu', async () => {
    const { element, rows } = await render([]);
    expect(element.textContent).toContain('No tenés pedidos en curso');
    const toMenu = [...element.querySelectorAll('a')].find((a) => a.textContent?.includes('Ver el menú'));
    expect(toMenu?.getAttribute('href')).toBe('/');
    expect(rows()).toHaveLength(0);
  });

  it('with one order, lists it (the tab itself jumps straight to it)', async () => {
    const { rows } = await render([order('a', 'B-001', 'preparing')]);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].getAttribute('href')).toBe('/pedido/a');
  });

  it('with two or more, lists each with code, state, size and a link to its screen; ready first', async () => {
    const { element, rows } = await render([
      order('a', 'B-001', 'preparing'),
      order('b', 'B-002', 'ready'),
    ]);

    expect(rows().map((row) => row.getAttribute('href'))).toEqual(['/pedido/b/listo', '/pedido/a']);
    expect(rows()[0].textContent).toContain('B-002');
    expect(rows()[0].textContent).toContain('Listo para retirar');
    expect(rows()[1].textContent).toContain('B-001');
    expect(rows()[1].textContent).toContain('Lo están preparando');
    expect(rows()[1].textContent).toContain('2 productos · $6.400');
    expect(element.querySelector('.tabbar')?.textContent).toContain('Mis pedidos');
    expect(element.querySelector('.tab__badge')?.textContent?.trim()).toBe('2');
  });
});
