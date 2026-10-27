/**
 * API contract shared by the Angular frontend and the NestJS backend.
 *
 * The MVP follows wireframe "Alternativa D" (docs/diseno/wireframe/alternativa-d):
 * no accounts, the customer only gives a name at payment time, Mercado Pago is
 * the only payment method, and an order enters the kitchen only once its
 * payment is approved.
 */

// ---------------------------------------------------------------- catalog ---

/** Dietary restrictions surfaced as optional menu filters. */
export type DietaryTag = 'gluten_free' | 'vegetarian' | 'vegan';

/**
 * Menu grouping. `mains`, `sandwiches` and `drinks` are the category chips the
 * wireframe draws ("Minutas", "Sándwiches", "Bebidas"); `bakery` has no chip and
 * only shows under "Todo".
 */
export type ProductCategory = 'mains' | 'sandwiches' | 'drinks' | 'bakery';

export interface Product {
  id: string;
  name: string;
  /** Price in ARS cents, to keep money off floating point. */
  priceCents: number;
  category: ProductCategory;
  dietaryTags: DietaryTag[];
  /** Absent until real buffet photography replaces the demo placeholders. */
  imageUrl?: string;
  /** False when the buffet ran out of it. The product still shows, without the add action. */
  available: boolean;
  /** Preparation estimate in minutes, used for the order time estimate. */
  prepMinutes: number;
}

// ----------------------------------------------------------------- orders ---

export type PaymentMethod = 'mercado_pago';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

/** Outcome reported by the (simulated) Mercado Pago checkout. */
export type PaymentResult = 'approved' | 'rejected';

/**
 * The order lifecycle.
 *
 * `awaiting_payment` is the only state before the kitchen: a rejected payment
 * leaves the order there. `received` means "paid and in the kitchen". `ready`
 * triggers the notification, which is the product's core promise.
 */
export type OrderStatus =
  | 'awaiting_payment'
  | 'received'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

/** The states an order passes through once it is in the kitchen, in order. */
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'received',
  'preparing',
  'ready',
  'delivered',
];

/** Orders the buffet still has to work on or hand over. */
export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = ['received', 'preparing', 'ready'];

/** End states: nothing else can happen to the order. */
export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['delivered', 'cancelled'];

/** Next step of the kitchen flow, or undefined when there is none. */
export function nextKitchenStatus(status: OrderStatus): OrderStatus | undefined {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  return index >= 0 && index < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[index + 1]
    : undefined;
}

/** Preparation time range shown as "12 a 15 min". */
export interface PrepEstimate {
  minMinutes: number;
  maxMinutes: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  /** Server-side price at the time of the order. */
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface PaymentAttempt {
  result: PaymentResult;
  method: PaymentMethod;
  /** ISO timestamp of when the gateway answered. */
  at: string;
  /** Gateway reference, e.g. "SIM-1a2b3c". */
  reference: string;
}

export interface Order {
  id: string;
  /** Short daily code the customer shows at the counter, e.g. "B-047". Issued when the payment is approved. */
  pickupCode?: string;
  /** "¿A nombre de quién?" — the only personal data the MVP asks for. */
  customerName: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Preparation estimate. Recomputed against the kitchen queue when the payment is approved. */
  estimate: PrepEstimate;
  lastPaymentAttempt?: PaymentAttempt;
  createdAt: string;
  /** When the payment was approved and the order entered the kitchen. */
  paidAt?: string;
  /** paidAt + estimate.maxMinutes. Drives "Listo en N minutos aprox.". */
  estimatedReadyAt?: string;
  preparingAt?: string;
  /** Set when the buffet marks the order ready. Drives the notification. */
  readyAt?: string;
  /** "Te esperamos hasta las HH:MM": readyAt + the pickup hold window. */
  pickupDeadlineAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

// ------------------------------------------------------------ public API ---

export interface CartItemRequest {
  productId: string;
  quantity: number;
}

/** POST /api/orders/quote */
export interface QuoteRequest {
  items: CartItemRequest[];
}

export interface OrderQuote {
  items: OrderItem[];
  totalCents: number;
  estimate: PrepEstimate;
}

/** POST /api/orders */
export interface CreateOrderRequest {
  customerName: string;
  items: CartItemRequest[];
}

/** POST /api/orders/:id/payments */
export interface PaymentResponse {
  result: PaymentResult;
  processedAt: string;
  order: Order;
}

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNKNOWN_PRODUCT'
  | 'PRODUCT_UNAVAILABLE'
  | 'ORDER_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'ILLEGAL_TRANSITION'
  | 'PAYMENT_NOT_ALLOWED'
  | 'UNAUTHORIZED'
  | 'BACKSTAGE_DISABLED'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorBody {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  /** Product ids involved, for stock and catalog errors. */
  productIds?: string[];
}

// ------------------------------------------------- backstage (team only) ---

/** Header carrying the backstage key. */
export const BACKSTAGE_KEY_HEADER = 'x-backstage-key';

/** POST /api/backstage/orders/:id/status */
export interface SetOrderStatusRequest {
  status: OrderStatus;
}

/** PATCH /api/backstage/products/:id */
export interface SetAvailabilityRequest {
  available: boolean;
}

/** What the simulated Mercado Pago answers on the next payment. */
export type SimulatedPaymentMode = 'approve' | 'reject';

/** GET|PUT /api/backstage/payments/next */
export interface PaymentSimulationState {
  nextResult: SimulatedPaymentMode;
}

// ------------------------------------------------------------- constants ---

/** The pickup point named in the app bar. */
export const PICKUP_POINT_NAME = 'Buffet Central';
