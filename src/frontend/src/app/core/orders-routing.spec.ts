import { legacyReadyUrl, ordersLandingUrl, orderUrl } from './orders-routing';

describe('orders routing', () => {
  it('links an order to its status screen, or to 06 when it is ready', () => {
    expect(orderUrl({ id: 'a', status: 'preparing' })).toBe('/pedido/a');
    expect(orderUrl({ id: 'a', status: 'ready' })).toBe('/pedido/a/listo');
    expect(orderUrl({ id: 'a b', status: 'received' })).toBe('/pedido/a%20b');
  });

  describe('the "Mis pedidos" tab', () => {
    it('shows the empty state when there is no order', () => {
      expect(ordersLandingUrl([])).toBeNull();
    });

    it('goes straight to the only order, as in the wireframe', () => {
      expect(ordersLandingUrl([{ id: 'a', status: 'received' }])).toBe('/pedido/a');
      expect(ordersLandingUrl([{ id: 'a', status: 'ready' }])).toBe('/pedido/a/listo');
    });

    it('shows the list when there are two or more', () => {
      expect(
        ordersLandingUrl([
          { id: 'a', status: 'received' },
          { id: 'b', status: 'ready' },
        ]),
      ).toBeNull();
    });
  });

  describe('the old /pedido/listo link', () => {
    it('opens the order that is ready (the latest one if several)', () => {
      expect(
        legacyReadyUrl([
          { id: 'a', status: 'ready' },
          { id: 'b', status: 'preparing' },
          { id: 'c', status: 'ready' },
        ]),
      ).toBe('/pedido/c/listo');
    });

    it('falls back to the only order, or to the list', () => {
      expect(legacyReadyUrl([{ id: 'a', status: 'preparing' }])).toBe('/pedido/a');
      expect(
        legacyReadyUrl([
          { id: 'a', status: 'preparing' },
          { id: 'b', status: 'received' },
        ]),
      ).toBe('/pedido');
      expect(legacyReadyUrl([])).toBe('/pedido');
    });
  });
});
