import { describe, expect, it } from 'vitest';
import { calculateOrderPricing } from '../utils/pricing.js';

describe('calculateOrderPricing', () => {
  it('returns the fields consumed by checkout and Razorpay in rupees and paise', () => {
    const pricing = calculateOrderPricing({
      product: { monthlyRent: 1199, deposit: 3000, tenurePrices: {} },
      tenureMonths: 6,
      serviceArea: { deliveryFee: 499 }
    });

    expect(pricing.taxRupees).toBe(216);
    expect(pricing.totalUpfrontRupees).toBe(4914);
    expect(pricing.totalUpfrontPaise).toBe(491400);
  });

  it('correctly applies percentage coupon with max discount cap', () => {
    const pricing = calculateOrderPricing({
      product: { monthlyRent: 2000, deposit: 5000, tenurePrices: {} },
      tenureMonths: 12,
      serviceArea: { deliveryFee: 499 },
      coupon: { active: true, discountType: 'PERCENTAGE', discountValue: 10, maxDiscount: 500 }
    });

    // Upfront before discount = 2000 + 5000 + 499 + 360 (GST) = 7859
    // 10% of 7859 = 786, capped at maxDiscount 500
    expect(pricing.discountRupees).toBe(500);
    expect(pricing.totalUpfrontRupees).toBe(7359);
  });

  it('correctly applies flat coupon discount', () => {
    const pricing = calculateOrderPricing({
      product: { monthlyRent: 1500, deposit: 3000, tenurePrices: {} },
      tenureMonths: 6,
      serviceArea: { deliveryFee: 399 },
      coupon: { active: true, discountType: 'FLAT', discountValue: 300 }
    });

    // Upfront before discount = 1500 + 3000 + 399 + 270 = 5169
    expect(pricing.discountRupees).toBe(300);
    expect(pricing.totalUpfrontRupees).toBe(4869);
  });
});
