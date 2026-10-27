import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ACTIVE_ORDER_STATUSES, type Order, type OrderStatus } from '@buffetya/shared';
import { ApiClient } from './api.client';
import { orderUrl } from './orders-routing';
import { ReadyNotifier } from './ready-notifier';
import { APP_STORAGE, readJson, type KeyValueStorage } from './storage';

/** What the device remembers about each order it follows. */
export interface TrackedOrder {
  id: string;
  status: OrderStatus;
  pickupCode?: string;
  /** Its final state (cancelled) was already shown to the customer. */
  seen?: boolean;
}

export interface OrderEntry extends TrackedOrder {
  /** Latest copy from the server; null until it arrives. */
  order: Order | null;
}

export const ORDERS_KEY = 'buffetya.orders.v2';
/** Key of the previous version, which followed a single order. */
export const LEGACY_ACTIVE_ORDER_KEY = 'buffetya.activeOrder.v1';
const NOTIFIED_KEY = 'buffetya.notifiedReady.v1';
const POLL_MS = 5_000;
/** While on these screens the app does not jump to 06 by itself. */
const NO_AUTO_NAVIGATION = ['/backstage', '/checkout', '/pago'];

const isInProgress = (status: OrderStatus) => ACTIVE_ORDER_STATUSES.includes(status);

/** In progress, or cancelled and not yet shown: what "Mis pedidos" keeps. */
const isKept = (order: TrackedOrder) =>
  isInProgress(order.status) || (order.status === 'cancelled' && !order.seen);

const isTracked = (value: unknown): value is TrackedOrder =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as TrackedOrder).id === 'string' &&
  typeof (value as TrackedOrder).status === 'string';

const isTrackedList = (value: unknown): value is TrackedOrder[] =>
  Array.isArray(value) && value.every(isTracked);

const isIdList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Reads the saved list, folding in the single order of the previous version. */
function restore(storage: KeyValueStorage): TrackedOrder[] {
  const list = readJson(storage, ORDERS_KEY, isTrackedList) ?? [];
  const legacy = readJson(storage, LEGACY_ACTIVE_ORDER_KEY, isTracked);
  if (legacy) {
    storage.removeItem(LEGACY_ACTIVE_ORDER_KEY);
    if (!list.some((order) => order.id === legacy.id)) {
      list.push({ id: legacy.id, status: legacy.status });
    }
  }
  // Delivered orders are done; a cancelled one stays until it has been seen.
  return list.filter(isKept);
}

/**
 * The paid orders this device is following ("Mis pedidos"). Several can be in
 * progress at once: paying a new one never replaces the others. The list lives
 * in localStorage, so reopening the app comes back to them.
 *
 * Every order in progress is followed live over one SSE stream; if it drops,
 * the store polls until the tab is visible again. When an order turns ready:
 * a notification that names its pickup code, vibration, and 06 for that order.
 */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly api = inject(ApiClient);
  private readonly storage = inject(APP_STORAGE);
  private readonly router = inject(Router);
  private readonly notifier = inject(ReadyNotifier);

  private readonly tracked = signal<TrackedOrder[]>(restore(this.storage));
  private readonly details = signal<ReadonlyMap<string, Order>>(new Map());
  private readonly unreachable = signal<ReadonlySet<string>>(new Set());

  readonly entries = computed<OrderEntry[]>(() =>
    this.tracked().map((tracked) => ({ ...tracked, order: this.details().get(tracked.id) ?? null })),
  );
  readonly count = computed(() => this.tracked().length);
  readonly anyReady = computed(() => this.tracked().some((order) => order.status === 'ready'));

  private source: EventSource | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  /** Ids the current stream (or poll) follows, joined. */
  private followedKey = '';

  constructor() {
    this.persist();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') this.reconnect();
    };
    document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      this.stopFollowing();
    });
    this.follow();
  }

  /** True when the app was closed with an order still in the kitchen or at the counter. */
  hasOrderInProgress(): boolean {
    return this.tracked().some((order) => isInProgress(order.status));
  }

  orderById(id: string): Order | null {
    return this.details().get(id) ?? null;
  }

  isTracked(id: string): boolean {
    return this.tracked().some((order) => order.id === id);
  }

  /** The server does not know this order (or it could not be loaded at all). */
  isUnreachable(id: string): boolean {
    return this.unreachable().has(id);
  }

  /** An order whose payment was just approved joins the list. */
  add(order: Order): void {
    this.details.update((map) => new Map(map).set(order.id, order));
    if (!this.isTracked(order.id)) {
      this.tracked.update((list) => [...list, this.trackedFrom(order)]);
      this.persist();
    }
    this.follow();
  }

  /** A status screen opened for `id`: fresh data, and follow it if it is in progress. */
  watch(id: string): void {
    this.fetch(id, true);
  }

  /** Fresh data for every order (the list screen just opened). */
  refresh(): void {
    this.tracked().forEach((order) => this.fetch(order.id));
  }

  /** The customer has seen the final state of this order. */
  markSeen(id: string): void {
    this.updateTracked(id, (order) => (isInProgress(order.status) ? order : { ...order, seen: true }));
  }

  /** Drops an order from "Mis pedidos". */
  forget(id: string): void {
    this.tracked.update((list) => list.filter((order) => order.id !== id));
    this.details.update((map) => {
      const next = new Map(map);
      next.delete(id);
      return next;
    });
    this.persist();
    this.follow();
  }

  private fetch(id: string, adopt = false): void {
    this.api.order(id).subscribe({
      next: (order) => {
        this.markReachable(id);
        if (adopt && !this.isTracked(id) && isInProgress(order.status) && order.paymentStatus === 'approved') {
          this.add(order);
          return;
        }
        this.apply(order);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          if (this.isTracked(id)) this.forget(id);
          this.unreachable.update((set) => new Set(set).add(id));
        } else if (!this.details().has(id)) {
          this.unreachable.update((set) => new Set(set).add(id));
        }
      },
    });
  }

  /** One stream for every order in progress; re-opened when that set changes. */
  private follow(): void {
    const ids = this.tracked()
      .filter((order) => isInProgress(order.status))
      .map((order) => order.id);
    const key = ids.join(',');
    if (key === this.followedKey) return;
    this.stopFollowing();
    this.followedKey = key;
    if (ids.length === 0) return;

    ids.filter((id) => !this.details().has(id)).forEach((id) => this.fetch(id));
    if (typeof EventSource === 'undefined') {
      this.startPolling();
      return;
    }
    const source = new EventSource(this.api.ordersEventsUrl(ids));
    this.source = source;
    source.onmessage = (event: MessageEvent<string>) => {
      try {
        this.apply(JSON.parse(event.data) as Order);
      } catch {
        // A malformed event is skipped; the next one or the poll catches up.
      }
    };
    source.onerror = () => {
      source.close();
      if (this.source === source) this.source = null;
      this.startPolling();
    };
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      this.tracked()
        .filter((order) => isInProgress(order.status))
        .forEach((order) => this.fetch(order.id));
    }, POLL_MS);
  }

  private reconnect(): void {
    this.followedKey = '';
    this.follow();
  }

  private stopFollowing(): void {
    this.source?.close();
    this.source = null;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.followedKey = '';
  }

  private apply(order: Order): void {
    const previous = this.details().get(order.id);
    this.details.update((map) => new Map(map).set(order.id, order));
    if (!this.isTracked(order.id)) return;
    this.updateTracked(order.id, (tracked) => ({ ...tracked, status: order.status, pickupCode: order.pickupCode }));

    if (order.status === 'ready' && !this.alreadyNotified(order.id)) {
      this.rememberNotified(order.id);
      // A live change gets the system notification; an order found ready on
      // reopening the app only gets the screen change.
      if (previous !== undefined && previous.status !== 'ready') {
        void this.notifier.notifyReady(order);
      }
      this.goToReadyScreen(order);
    }

    if (order.status === 'delivered' && !this.isViewing(order.id)) {
      this.forget(order.id);
      return;
    }
    this.follow();
  }

  private goToReadyScreen(order: Order): void {
    const url = this.router.url;
    const onAnotherReadyScreen = /^\/pedido\/[^/]+\/listo/.test(url);
    if (onAnotherReadyScreen || NO_AUTO_NAVIGATION.some((prefix) => url.startsWith(prefix))) return;
    void this.router.navigateByUrl(orderUrl(order));
  }

  private isViewing(id: string): boolean {
    return this.router.url.startsWith(`/pedido/${encodeURIComponent(id)}`);
  }

  private trackedFrom(order: Order): TrackedOrder {
    return { id: order.id, status: order.status, pickupCode: order.pickupCode };
  }

  private updateTracked(id: string, change: (order: TrackedOrder) => TrackedOrder): void {
    this.tracked.update((list) => list.map((order) => (order.id === id ? change(order) : order)));
    this.persist();
  }

  private markReachable(id: string): void {
    if (!this.unreachable().has(id)) return;
    this.unreachable.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  private persist(): void {
    this.storage.setItem(ORDERS_KEY, JSON.stringify(this.tracked()));
  }

  private alreadyNotified(id: string): boolean {
    return (readJson(this.storage, NOTIFIED_KEY, isIdList) ?? []).includes(id);
  }

  private rememberNotified(id: string): void {
    const ids = readJson(this.storage, NOTIFIED_KEY, isIdList) ?? [];
    this.storage.setItem(NOTIFIED_KEY, JSON.stringify([...ids, id].slice(-30)));
  }
}
