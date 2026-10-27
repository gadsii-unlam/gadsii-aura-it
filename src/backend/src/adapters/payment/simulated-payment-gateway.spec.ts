import { SimulatedPaymentGateway } from './simulated-payment-gateway.js';

const request = { orderId: 'order-1', amountCents: 800_000, customerName: 'Martín' };

describe('SimulatedPaymentGateway', () => {
  it('approves by default', async () => {
    const gateway = new SimulatedPaymentGateway();
    expect(gateway.getNextResult()).toBe('approve');
    expect((await gateway.charge(request)).result).toBe('approved');
  });

  it('rejects exactly once when the team asks for it, then goes back to approving', async () => {
    const gateway = new SimulatedPaymentGateway();
    gateway.setNextResult('reject');

    expect((await gateway.charge(request)).result).toBe('rejected');
    expect(gateway.getNextResult()).toBe('approve');
    expect((await gateway.charge(request)).result).toBe('approved');
  });

  it('gives every charge a simulated reference', async () => {
    const gateway = new SimulatedPaymentGateway();
    const first = await gateway.charge(request);
    const second = await gateway.charge(request);
    expect(first.reference).toMatch(/^SIM-/);
    expect(first.reference).not.toBe(second.reference);
  });
});
