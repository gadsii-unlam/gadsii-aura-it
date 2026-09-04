/**
 * Contracts shared by the Angular frontend and the NestJS backend.
 *
 * These types were derived from the design prototype in `src/design/`, so the
 * screens and the API describe the same product rather than drifting apart.
 */

/** Dietary restrictions surfaced as menu filters. */
export type DietaryTag = 'gluten_free' | 'vegetarian' | 'vegan';

/** Menu grouping shown as the sticky category row. */
export type ProductCategory =
  | 'mains'
  | 'sandwiches'
  | 'empanadas'
  | 'coffee_shop'
  | 'drinks';

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Price in ARS cents, to keep money off floating point. */
  priceCents: number;
  category: ProductCategory;
  dietaryTags: DietaryTag[];
  /** Absent until real buffet photography replaces the demo placeholders. */
  imageUrl?: string;
  available: boolean;
  /** Preparation estimate in minutes, used for the order ETA. */
  prepMinutes: number;
}

export type PaymentMethod = 'mercado_pago' | 'cash_on_pickup';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'due_on_pickup';

/**
 * The order lifecycle. `ready` is the state that triggers the push
 * notification, which is the product's core promise.
 */
export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  /** Free-text note the student writes for the kitchen. */
  note?: string;
}

export interface Order {
  id: string;
  /** Short code the student shows at the counter, e.g. "B-047". */
  pickupCode: string;
  userId: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  /** Set when the buffet marks the order ready. Drives the notification. */
  readyAt?: string;
  deliveredAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  /** Optional: collected as profile data, never used as a credential. */
  documentNumber?: string;
  dietaryPreferences: DietaryTag[];
  notificationsEnabled: boolean;
}

/** Payload sent to Firebase Cloud Messaging when an order becomes ready. */
export interface OrderReadyNotification {
  orderId: string;
  pickupCode: string;
  title: string;
  body: string;
}

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'received',
  'preparing',
  'ready',
  'delivered',
];
