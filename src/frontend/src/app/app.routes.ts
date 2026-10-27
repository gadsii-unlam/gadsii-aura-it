import { inject } from '@angular/core';
import { type CanActivateFn, Router, type Routes } from '@angular/router';
import { legacyReadyUrl, ordersLandingUrl } from './core/orders-routing';
import { OrdersStore } from './core/orders.store';

/**
 * Reopening the app with an order still in progress goes straight to "Mis
 * pedidos" (which opens the order itself when there is only one). Only on the
 * first navigation, so the "Menú" tab keeps working.
 */
const resumeOrders: CanActivateFn = () => {
  const router = inject(Router);
  if (router.navigated) return true;
  return inject(OrdersStore).hasOrderInProgress() ? router.parseUrl('/pedido') : true;
};

/** "Mis pedidos": one order opens directly; none or several show this screen. */
const ordersLanding: CanActivateFn = () => {
  const url = ordersLandingUrl(inject(OrdersStore).entries());
  return url ? inject(Router).parseUrl(url) : true;
};

/** One route per screen of wireframe D, plus the checkout, the orders list and the backstage. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'BuffetYa!',
    canActivate: [resumeOrders],
    loadComponent: () => import('./pages/menu.page').then((m) => m.MenuPage),
  },
  {
    path: 'carrito',
    title: 'Mi carrito · BuffetYa!',
    loadComponent: () => import('./pages/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'pago',
    title: 'Pago · BuffetYa!',
    loadComponent: () => import('./pages/payment.page').then((m) => m.PaymentPage),
  },
  {
    path: 'checkout/:orderId',
    title: 'Mercado Pago',
    loadComponent: () => import('./pages/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'pago/aprobado/:orderId',
    title: 'Pago aprobado · BuffetYa!',
    loadComponent: () => import('./pages/payment-approved.page').then((m) => m.PaymentApprovedPage),
  },
  {
    path: 'pago/rechazado/:orderId',
    title: 'No se pudo pagar · BuffetYa!',
    loadComponent: () => import('./pages/payment-rejected.page').then((m) => m.PaymentRejectedPage),
  },
  {
    path: 'pedido',
    pathMatch: 'full',
    title: 'Mis pedidos · BuffetYa!',
    canActivate: [ordersLanding],
    loadComponent: () => import('./pages/orders.page').then((m) => m.OrdersPage),
  },
  {
    // Link of the single-order version (and of older notifications).
    path: 'pedido/listo',
    redirectTo: () => legacyReadyUrl(inject(OrdersStore).entries()),
  },
  {
    path: 'pedido/:orderId',
    title: 'Mi pedido · BuffetYa!',
    loadComponent: () => import('./pages/order-status.page').then((m) => m.OrderStatusPage),
  },
  {
    path: 'pedido/:orderId/listo',
    title: 'Listo para retirar · BuffetYa!',
    loadComponent: () => import('./pages/order-ready.page').then((m) => m.OrderReadyPage),
  },
  {
    // Team only: not linked from anywhere in the app.
    path: 'backstage',
    title: 'Backstage · BuffetYa!',
    loadComponent: () => import('./pages/backstage.page').then((m) => m.BackstagePage),
  },
  { path: '**', redirectTo: '' },
];
