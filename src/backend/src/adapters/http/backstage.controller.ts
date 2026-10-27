import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { Order, PaymentSimulationState, Product } from '@buffetya/shared';
import { CatalogService } from '../../application/catalog.service.js';
import { OrderingService } from '../../application/ordering.service.js';
import { parseAvailability, parsePaymentMode, parseStatus } from '../../application/requests.js';
import { SimulatedPaymentGateway } from '../payment/simulated-payment-gateway.js';
import { BackstageGuard } from './backstage.guard.js';

/**
 * Team-only endpoints that simulate what the buffet staff and Mercado Pago do
 * "behind the scenes" during test sessions. Not part of the user flow.
 */
@Controller('backstage')
@UseGuards(BackstageGuard)
export class BackstageController {
  constructor(
    @Inject(OrderingService) private readonly ordering: OrderingService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(SimulatedPaymentGateway) private readonly payments: SimulatedPaymentGateway,
  ) {}

  /** Paid orders still in the kitchen or waiting at the counter. */
  @Get('orders')
  activeOrders(): Promise<Order[]> {
    return this.ordering.listActive();
  }

  @Post('orders/:id/status')
  @HttpCode(200)
  changeStatus(@Param('id') id: string, @Body() body: unknown): Promise<Order> {
    return this.ordering.changeStatus(id, parseStatus(body));
  }

  @Patch('products/:id')
  setAvailability(@Param('id') id: string, @Body() body: unknown): Promise<Product> {
    return this.catalog.setAvailability(id, parseAvailability(body));
  }

  @Get('payments/next')
  nextPayment(): PaymentSimulationState {
    return { nextResult: this.payments.getNextResult() };
  }

  /** "reject" makes only the next payment fail; then it goes back to "approve". */
  @Put('payments/next')
  setNextPayment(@Body() body: unknown): PaymentSimulationState {
    this.payments.setNextResult(parsePaymentMode(body));
    return { nextResult: this.payments.getNextResult() };
  }
}
