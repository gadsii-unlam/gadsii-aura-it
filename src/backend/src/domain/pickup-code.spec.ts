import { dateKeyIn, formatPickupCode, issuePickupCode } from './pickup-code.js';

describe('pickup codes', () => {
  it('formats the daily sequence like the wireframe (B-047)', () => {
    expect(formatPickupCode(47)).toBe('B-047');
    expect(formatPickupCode(1)).toBe('B-001');
  });

  it('does not truncate past 999', () => {
    expect(formatPickupCode(1000)).toBe('B-1000');
  });

  it('starts the day at B-001', () => {
    const issued = issuePickupCode(undefined, '2026-10-25');
    expect(issued.code).toBe('B-001');
    expect(issued.state).toEqual({ dateKey: '2026-10-25', lastSequence: 1 });
  });

  it('increments within the same day', () => {
    const first = issuePickupCode(undefined, '2026-10-25');
    const second = issuePickupCode(first.state, '2026-10-25');
    const third = issuePickupCode(second.state, '2026-10-25');
    expect([first.code, second.code, third.code]).toEqual(['B-001', 'B-002', 'B-003']);
  });

  it('resets when the day changes', () => {
    const lastOfDay = { dateKey: '2026-10-25', lastSequence: 46 };
    expect(issuePickupCode(lastOfDay, '2026-10-25').code).toBe('B-047');
    expect(issuePickupCode(lastOfDay, '2026-10-26').code).toBe('B-001');
  });

  it('computes the calendar day in the buffet time zone, not in UTC', () => {
    // 01:30 UTC on the 26th is still 22:30 on the 25th in Buenos Aires.
    const lateEvening = new Date('2026-10-26T01:30:00Z');
    expect(dateKeyIn('America/Argentina/Buenos_Aires', lateEvening)).toBe('2026-10-25');
    expect(dateKeyIn('UTC', lateEvening)).toBe('2026-10-26');
  });
});
