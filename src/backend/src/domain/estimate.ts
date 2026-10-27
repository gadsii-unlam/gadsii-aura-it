import type { PrepEstimate } from '@buffetya/shared';

/** Extra minutes per order already in the kitchen (received or preparing). */
export const QUEUE_MINUTES_PER_ORDER = 2;

/** Narrowest range ever shown: "12 a 15 min". */
export const MIN_RANGE_MINUTES = 3;

/** The range widens with the wait: a quarter of the lower bound. */
export const RANGE_RATIO = 0.25;

/**
 * Preparation time estimate shown before paying (02 · Mi carrito) and used for
 * "Listo en N minutos aprox." once the order is in the kitchen.
 *
 * The wireframe leaves the source of the number open for TP5. This is the
 * simplest rule that reacts to the two things that obviously matter:
 *
 *   lower bound = slowest item of the order + QUEUE_MINUTES_PER_ORDER * orders ahead
 *   upper bound = lower bound + max(MIN_RANGE_MINUTES, RANGE_RATIO * lower bound)
 *
 * Items are assumed to be prepared in parallel, so quantity does not add time.
 */
export function estimatePreparation(prepMinutes: readonly number[], ordersAhead: number): PrepEstimate {
  if (prepMinutes.length === 0) {
    throw new Error('Cannot estimate an order without items');
  }
  const slowest = Math.max(...prepMinutes.map((minutes) => Math.max(0, minutes)));
  const queue = Math.max(0, Math.floor(ordersAhead));
  const minMinutes = Math.max(1, slowest + queue * QUEUE_MINUTES_PER_ORDER);
  const range = Math.max(MIN_RANGE_MINUTES, Math.round(minMinutes * RANGE_RATIO));
  return { minMinutes, maxMinutes: minMinutes + range };
}
