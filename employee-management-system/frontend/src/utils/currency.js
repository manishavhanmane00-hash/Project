// =============================================
// INR Currency Utilities
// Default currency: Indian Rupee (₹)
// =============================================

/**
 * Format a number as Indian Rupee with Indian number system (lakh/crore grouping).
 * e.g. 100000 → ₹1,00,000   |   1500000 → ₹15,00,000
 */
export const formatINR = (value, options = {}) => {
  const {
    decimals = 0,
    compact = false,
    symbol = '₹',
  } = options;

  const num = Number(value) || 0;

  if (compact) {
    if (num >= 10000000) return `${symbol}${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000)   return `${symbol}${(num / 100000).toFixed(2)} L`;
    if (num >= 1000)     return `${symbol}${(num / 1000).toFixed(1)}K`;
    return `${symbol}${num.toFixed(decimals)}`;
  }

  // Indian number formatting (en-IN locale)
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatted}`;
};

/**
 * Format monthly salary from annual figure.
 */
export const monthlyINR = (annualAmount, options = {}) =>
  formatINR(Math.round(annualAmount / 12), options);

/**
 * Currency symbol constant.
 */
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE   = 'INR';
export const CURRENCY_LOCALE = 'en-IN';

/**
 * Compact formatter for dashboard cards — shows ₹1.2L, ₹5.4Cr etc.
 */
export const formatINRCompact = (value) => formatINR(value, { compact: true });
