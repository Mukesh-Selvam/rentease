/**
 * Standardized RentEase Server-Side Pricing Engine
 * Computes monthly rent, deposit, delivery fee, GST taxes, and coupon discounts in integer paise.
 */

export function calculateOrderPricing({
  product,
  tenureMonths = 6,
  serviceArea = null,
  coupon = null
}) {
  const tenureKey = String(tenureMonths);
  const tenurePricesMap = product.tenurePrices instanceof Map
    ? Object.fromEntries(product.tenurePrices)
    : product.tenurePrices || {};

  // Monthly rent for selected tenure (default to product.monthlyRent if not set)
  const monthlyRentRupees = tenurePricesMap[tenureKey] || product.monthlyRent || 0;
  const depositRupees = product.deposit || 0;

  // Delivery fee based on city service area rules (default 499 if not set)
  const deliveryFeeRupees = serviceArea ? (serviceArea.deliveryFee || 0) : 399;

  // 18% GST Tax on monthly rent
  const taxRupees = Math.round(monthlyRentRupees * 0.18);

  // Subtotal due upfront today = 1st Month Rent + Refundable Security Deposit + Delivery Fee + GST Taxes
  let totalUpfrontRupees = monthlyRentRupees + depositRupees + deliveryFeeRupees + taxRupees;
  let discountRupees = 0;

  // Apply Coupon Discount if provided
  const isCouponActive = coupon && (coupon.active !== false && coupon.isActive !== false);
  if (coupon && isCouponActive) {
    if (coupon.discountType === 'PERCENTAGE') {
      discountRupees = Math.round((totalUpfrontRupees * coupon.discountValue) / 100);
      const cap = coupon.maxDiscount || coupon.maxDiscountAmount;
      if (cap && discountRupees > cap) {
        discountRupees = cap;
      }
    } else if (coupon.discountType === 'FLAT' || coupon.discountType === 'FIXED') {
      discountRupees = coupon.discountValue;
    }
    discountRupees = Math.min(discountRupees, totalUpfrontRupees);
    totalUpfrontRupees = Math.max(0, totalUpfrontRupees - discountRupees);
  }

  // Convert all money values to integer paise (1 INR = 100 paise)
  return {
    monthlyRentRupees,
    depositRupees,
    deliveryFeeRupees,
    taxRupees,
    discountRupees,
    totalUpfrontRupees,

    monthlyRentPaise: Math.round(monthlyRentRupees * 100),
    depositPaise: Math.round(depositRupees * 100),
    deliveryFeePaise: Math.round(deliveryFeeRupees * 100),
    taxPaise: Math.round(taxRupees * 100),
    discountPaise: Math.round(discountRupees * 100),
    totalUpfrontPaise: Math.round(totalUpfrontRupees * 100)
  };
}
