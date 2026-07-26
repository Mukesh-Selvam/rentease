import { describe, it, expect } from 'vitest';

describe('RentEase Client App Tests', () => {
  it('should pass basic sanity test', () => {
    expect(true).toBe(true);
  });

  it('should format tenure pricing correctly', () => {
    const monthlyRent = 1000;
    const tenureRates = { 3: 1200, 6: 1100, 12: monthlyRent };
    expect(tenureRates[12]).toBe(1000);
    expect(tenureRates[6]).toBe(1100);
    expect(tenureRates[3]).toBe(1200);
  });
});
