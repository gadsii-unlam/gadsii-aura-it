/** Persisted state of the daily pickup code sequence. */
export interface PickupCounterState {
  /** Calendar day in the buffet time zone, YYYY-MM-DD. */
  dateKey: string;
  lastSequence: number;
}

const PREFIX = 'B';

/** "B-047": a short code the customer can read out or show at the counter. */
export function formatPickupCode(sequence: number): string {
  return `${PREFIX}-${String(sequence).padStart(3, '0')}`;
}

/**
 * Issues the next code of the day. The sequence restarts every calendar day,
 * so codes stay short. Codes are only issued for approved payments, so rejected
 * or abandoned orders never leave gaps in the sequence the counter sees.
 */
export function issuePickupCode(
  state: PickupCounterState | undefined,
  dateKey: string,
): { code: string; state: PickupCounterState } {
  const lastSequence = state && state.dateKey === dateKey ? state.lastSequence : 0;
  const next = lastSequence + 1;
  return { code: formatPickupCode(next), state: { dateKey, lastSequence: next } };
}

/** Calendar day (YYYY-MM-DD) of `date` in `timeZone`. */
export function dateKeyIn(timeZone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
