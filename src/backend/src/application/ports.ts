import type { Order, OrderStatus, PaymentResult, Product } from '@buffetya/shared';
import type { PickupCounterState } from '../domain/pickup-code.js';

/**
 * Ports: what the application needs from the outside world. Adapters live in
 * src/adapters. Swapping the JSON file store for Firebase means writing new
 * adapters for these interfaces; nothing in domain/ or application/ changes.
 */

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | undefined>;
  /** Returns the updated product, or undefined if it does not exist. */
  setAvailability(id: string, available: boolean): Promise<Product | undefined>;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | undefined>;
  findByStatus(statuses: readonly OrderStatus[]): Promise<Order[]>;
  save(order: Order): Promise<void>;
}

export interface PickupCounterRepository {
  load(): Promise<PickupCounterState | undefined>;
  save(state: PickupCounterState): Promise<void>;
}

export interface ChargeRequest {
  orderId: string;
  amountCents: number;
  customerName: string;
}

export interface ChargeOutcome {
  result: PaymentResult;
  reference: string;
}

/** Mercado Pago in production; simulated in the MVP. */
export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeOutcome>;
}

/** Pushes order changes to whoever follows them (SSE in the MVP). */
export interface OrderEventPublisher {
  publish(order: Order): void;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface OrderingSettings {
  /** IANA zone used for the daily pickup code sequence. */
  timeZone: string;
  /** Minutes the counter keeps a ready order. */
  pickupHoldMinutes: number;
}

// Nest injection tokens for the ports.
export const PRODUCT_REPOSITORY = Symbol('ProductRepository');
export const ORDER_REPOSITORY = Symbol('OrderRepository');
export const PICKUP_COUNTER_REPOSITORY = Symbol('PickupCounterRepository');
export const PAYMENT_GATEWAY = Symbol('PaymentGateway');
export const ORDER_EVENTS = Symbol('OrderEvents');
export const CLOCK = Symbol('Clock');
export const ID_GENERATOR = Symbol('IdGenerator');
