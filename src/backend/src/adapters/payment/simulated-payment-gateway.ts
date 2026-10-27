import { randomUUID } from 'node:crypto';
import type { SimulatedPaymentMode } from '@buffetya/shared';
import type { ChargeOutcome, ChargeRequest, PaymentGateway } from '../../application/ports.js';

/**
 * Stand-in for Mercado Pago, which the course allows to simulate in the MVP.
 * Approves every payment unless the team, from the backstage, asks for the next
 * one to be rejected; that request is spent on a single payment, so the default
 * always comes back to "approve".
 */
export class SimulatedPaymentGateway implements PaymentGateway {
  private nextResult: SimulatedPaymentMode = 'approve';

  getNextResult(): SimulatedPaymentMode {
    return this.nextResult;
  }

  setNextResult(mode: SimulatedPaymentMode): void {
    this.nextResult = mode;
  }

  async charge(_request: ChargeRequest): Promise<ChargeOutcome> {
    const mode = this.nextResult;
    this.nextResult = 'approve';
    return {
      result: mode === 'reject' ? 'rejected' : 'approved',
      reference: `SIM-${randomUUID().slice(0, 8)}`,
    };
  }
}
