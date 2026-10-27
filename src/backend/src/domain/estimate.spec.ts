import { estimatePreparation } from './estimate.js';

describe('estimatePreparation', () => {
  it('uses the slowest item as the base, as in the wireframe example (12 a 15 min)', () => {
    // Milanesa (12 min) + tarta (8 min), empty kitchen.
    expect(estimatePreparation([12, 8], 0)).toEqual({ minMinutes: 12, maxMinutes: 15 });
  });

  it('adds a fixed delay for every order already in the kitchen', () => {
    expect(estimatePreparation([12], 2)).toEqual({ minMinutes: 16, maxMinutes: 20 });
  });

  it('widens the range proportionally when the wait grows', () => {
    // 10 + 10 * 2 = 30 min; a quarter of that is wider than the 3 min floor.
    expect(estimatePreparation([10], 10)).toEqual({ minMinutes: 30, maxMinutes: 38 });
  });

  it('never promises less than one minute', () => {
    expect(estimatePreparation([0], 0)).toEqual({ minMinutes: 1, maxMinutes: 4 });
  });

  it('treats a negative queue as an empty one', () => {
    expect(estimatePreparation([5], -3)).toEqual(estimatePreparation([5], 0));
  });

  it('rejects an empty item list', () => {
    expect(() => estimatePreparation([], 0)).toThrow();
  });
});
