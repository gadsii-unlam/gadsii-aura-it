import { Injectable, signal } from '@angular/core';
import type { Order } from '@buffetya/shared';

export type NotificationAccess = 'granted' | 'denied' | 'default' | 'unsupported';

/** Copy from 06 · Listo para retirar (the lock-screen notification). */
export function readyNotificationText(order: Pick<Order, 'pickupCode'>): { title: string; body: string } {
  return {
    title: `Tu pedido ${order.pickupCode ?? ''} está listo`.replace(/\s+/g, ' '),
    body: 'Pasá a retirarlo por el mostrador.',
  };
}

const supportsNotifications = () => typeof globalThis.Notification !== 'undefined';

/**
 * "Te avisamos al celular": the system notification when an order turns ready.
 *
 * Shown through the service worker registration (works with the tab in the
 * background and is the only way on Android), with `new Notification` as a
 * fallback. Without permission it degrades to vibration plus the in-app
 * screen change. There is no push server in the MVP: the notification fires
 * while the app is open or in a background tab, not after it was closed.
 */
@Injectable({ providedIn: 'root' })
export class ReadyNotifier {
  readonly access = signal<NotificationAccess>(this.read());

  /** Must run inside a user gesture (a tap) for every browser to show the prompt. */
  async requestPermission(): Promise<NotificationAccess> {
    if (!supportsNotifications()) return 'unsupported';
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // Old Safari only has the callback form; treat it as not granted.
      }
    }
    const access = this.read();
    this.access.set(access);
    return access;
  }

  async notifyReady(order: Order): Promise<void> {
    navigator.vibrate?.([200, 100, 200]);
    this.access.set(this.read());
    if (this.access() !== 'granted') return;

    const { title, body } = readyNotificationText(order);
    const options: NotificationOptions & { vibrate?: number[] } = {
      body,
      tag: `order-ready-${order.id}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      // Read by Angular's service worker on click: focus the app, or open this order's 06.
      data: {
        onActionClick: {
          default: { operation: 'focusLastFocusedOrOpen', url: `/pedido/${encodeURIComponent(order.id)}/listo` },
        },
      },
    };

    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    } catch {
      // Fall through to the page-level notification.
    }
    try {
      new Notification(title, options);
    } catch {
      // Android Chrome only allows service-worker notifications. In-app only then.
    }
  }

  private read(): NotificationAccess {
    return supportsNotifications() ? Notification.permission : 'unsupported';
  }
}
