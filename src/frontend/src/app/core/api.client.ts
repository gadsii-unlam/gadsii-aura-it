import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  ApiErrorBody,
  CartItemRequest,
  CreateOrderRequest,
  Order,
  OrderQuote,
  PaymentResponse,
  Product,
} from '@buffetya/shared';
import type { Observable } from 'rxjs';

/** Same origin in production (Nest serves the app); proxied to Nest in `ng serve`. */
const API = '/api';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API}/products`);
  }

  quote(items: CartItemRequest[]): Observable<OrderQuote> {
    return this.http.post<OrderQuote>(`${API}/orders/quote`, { items });
  }

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${API}/orders`, request);
  }

  order(id: string): Observable<Order> {
    return this.http.get<Order>(`${API}/orders/${encodeURIComponent(id)}`);
  }

  pay(id: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${API}/orders/${encodeURIComponent(id)}/payments`, {});
  }

  /**
   * One SSE stream for several orders. `ngsw-bypass` keeps the service worker
   * out of the long-lived request.
   */
  ordersEventsUrl(ids: readonly string[]): string {
    return `${API}/orders/events?ids=${ids.map(encodeURIComponent).join(',')}&ngsw-bypass=true`;
  }
}

/** The API's error body, if the failure came from the API at all. */
export function apiErrorOf(error: unknown): ApiErrorBody | undefined {
  if (!(error instanceof HttpErrorResponse)) return undefined;
  const body = error.error as Partial<ApiErrorBody> | null;
  return body && typeof body.code === 'string' && typeof body.message === 'string'
    ? (body as ApiErrorBody)
    : undefined;
}
