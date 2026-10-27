import type { PrepEstimate } from '@buffetya/shared';

const pesos = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const clock = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });
// es-AR drops the leading zeros ("8/9") even with "2-digit", so pad by hand.
const pad = (value: number) => String(value).padStart(2, '0');
const dayMonth = { format: (date: Date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}` };

/** "$4.800", as the wireframe writes prices. */
export function formatArs(cents: number): string {
  return `$${pesos.format(cents / 100)}`;
}

/** "1 producto" / "2 productos". */
export function formatProductCount(count: number): string {
  return `${count} ${count === 1 ? 'producto' : 'productos'}`;
}

/** "12 a 15 min". */
export function formatEstimate(estimate: PrepEstimate): string {
  return `${estimate.minMinutes} a ${estimate.maxMinutes} min`;
}

/** "18:24" in the device's time zone. */
export function formatClock(iso: string): string {
  return clock.format(new Date(iso));
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "hoy 18:24", or "24/10 18:24" for another day. */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return `${sameDay(date, now) ? 'hoy' : dayMonth.format(date)} ${clock.format(date)}`;
}

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Martes 08/09": the menu header date. */
export function formatDayLabel(date: Date): string {
  return `${capitalize(weekday.format(date))} ${dayMonth.format(date)}`;
}

/** Whole minutes left until `iso`, rounded up and never below one. */
export function minutesUntil(iso: string, now: Date = new Date()): number {
  return Math.max(1, Math.ceil((new Date(iso).getTime() - now.getTime()) / 60_000));
}

/** "Listo en 6 minutos aprox." */
export function formatReadyIn(minutes: number): string {
  return `Listo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} aprox.`;
}
