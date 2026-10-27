import {
  formatArs,
  formatDayLabel,
  formatEstimate,
  formatProductCount,
  formatReadyIn,
  minutesUntil,
} from './format';

describe('formatting', () => {
  it('formats pesos like the wireframe ($4.800)', () => {
    expect(formatArs(480_000)).toBe('$4.800');
    expect(formatArs(800_000)).toBe('$8.000');
    expect(formatArs(90_000)).toBe('$900');
    expect(formatArs(12_345_600)).toBe('$123.456');
  });

  it('counts products in Spanish', () => {
    expect(formatProductCount(1)).toBe('1 producto');
    expect(formatProductCount(2)).toBe('2 productos');
  });

  it('formats the preparation range (12 a 15 min)', () => {
    expect(formatEstimate({ minMinutes: 12, maxMinutes: 15 })).toBe('12 a 15 min');
  });

  it('formats the day like "Martes 08/09"', () => {
    expect(formatDayLabel(new Date(2026, 8, 8))).toBe('Martes 08/09');
  });

  it('counts the minutes left, never below one', () => {
    const now = new Date('2026-10-25T21:24:00Z');
    expect(minutesUntil('2026-10-25T21:29:30Z', now)).toBe(6);
    expect(minutesUntil('2026-10-25T21:20:00Z', now)).toBe(1);
  });

  it('phrases the time left (Listo en 6 minutos aprox.)', () => {
    expect(formatReadyIn(6)).toBe('Listo en 6 minutos aprox.');
    expect(formatReadyIn(1)).toBe('Listo en 1 minuto aprox.');
  });
});
