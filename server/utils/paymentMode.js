export function isMockPaymentsEnabled() {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.ENABLE_MOCK_PAYMENTS === 'false') return false;
  if (process.env.ENABLE_MOCK_PAYMENTS === 'true') return true;

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const isPlaceholder = !keyId || !keySecret || keyId.includes('placeholder') || keyId.includes('your_razorpay');
  return isPlaceholder;
}
