/**
 * pricing.js — Single source of truth for all price calculations.
 * Used by both the live line-item preview and the final quotation summary.
 */

/**
 * Calculate the quantity (area / running feet / units) for a line item.
 * @param {Object} product
 * @param {Object} dimensions  { length, width }
 * @param {number} quantity    piece count (for per_unit products)
 * @returns {number}
 */
export function calcQuantity(product, dimensions, quantity = 1) {
  switch (product.unitType) {
    case 'per_sqft':
      return (parseFloat(dimensions.length) || 0) * (parseFloat(dimensions.width) || 0);
    case 'per_rft':
      return parseFloat(dimensions.length) || 0;
    case 'per_unit':
      return parseFloat(quantity) || 1;
    default:
      return 1;
  }
}

/**
 * Calculate the line total for a single cart item.
 * @param {Object} product       from products.json
 * @param {Object} tier          from qualityTiers.json
 * @param {Object} dimensions    { length, width }
 * @param {number} quantity      piece count
 * @param {Array}  selectedAddons array of addon objects from addons.json
 * @returns {{ qty: number, unitRate: number, addonTotal: number, lineTotal: number }}
 */
export function calcLineItem(product, tier, dimensions, quantity, selectedAddons = []) {
  const qty = calcQuantity(product, dimensions, quantity);
  const unitRate = tier?.ratePerUnit ?? 0;
  const addonTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const lineTotal = qty * unitRate + addonTotal;
  return { qty, unitRate, addonTotal, lineTotal };
}

/**
 * Calculate the full quotation totals from a cart.
 * @param {Array}  cartItems     array of cart line items (each has product, tier, dimensions, quantity, selectedAddons)
 * @param {Object} settings      from settings.json
 * @param {number} discountAmount already-resolved flat discount amount (₹)
 * @returns {{
 *   subtotal: number,
 *   discountAmount: number,
 *   taxableAmount: number,
 *   taxAmount: number,
 *   installationCharge: number,
 *   transportCharge: number,
 *   grandTotal: number,
 *   lineItems: Array
 * }}
 */
export function calcQuotation(cartItems, settings, discountAmount = 0) {
  const lineItems = cartItems.map((item) => {
    const { qty, unitRate, addonTotal, lineTotal } = calcLineItem(
      item.product,
      item.tier,
      item.dimensions,
      item.quantity,
      item.selectedAddons
    );
    return { ...item, qty, unitRate, addonTotal, lineTotal };
  });

  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const safeDiscount = Math.min(discountAmount, subtotal); // never exceed subtotal
  const taxableAmount = subtotal - safeDiscount;
  const gstPercent = settings?.gstPercent ?? 18;
  const taxAmount = (taxableAmount * gstPercent) / 100;
  const installationCharge = settings?.installationCharge ?? 0;
  const transportCharge = settings?.transportCharge ?? 0;
  const grandTotal = taxableAmount + taxAmount + installationCharge + transportCharge;

  return {
    subtotal,
    discountAmount: safeDiscount,
    taxableAmount,
    gstPercent,
    taxAmount,
    installationCharge,
    transportCharge,
    grandTotal,
    lineItems,
  };
}

/**
 * Resolve a promo code against the promoCodes list.
 * @param {string} code
 * @param {Array}  promoCodes   from promoCodes.json
 * @param {number} subtotal     current subtotal (before discount)
 * @returns {{ valid: boolean, message: string, discountAmount: number, promoCode: Object|null }}
 */
export function resolvePromoCode(code, promoCodes, subtotal) {
  if (!code) return { valid: false, message: '', discountAmount: 0, promoCode: null };

  const promo = promoCodes.find(
    (p) => p.code.toUpperCase() === code.toUpperCase() && p.active
  );

  if (!promo) {
    return { valid: false, message: 'Invalid promo code.', discountAmount: 0, promoCode: null };
  }

  if (subtotal < promo.minOrderValue) {
    return {
      valid: false,
      message: `Minimum order value ₹${promo.minOrderValue.toLocaleString('en-IN')} required for this code.`,
      discountAmount: 0,
      promoCode: null,
    };
  }

  const discountAmount =
    promo.discountType === 'percent'
      ? (subtotal * promo.discountValue) / 100
      : promo.discountValue;

  return {
    valid: true,
    message: `"${promo.code}" applied — ${promo.description}`,
    discountAmount,
    promoCode: promo,
  };
}

/**
 * Format a number as Indian currency string.
 * @param {number} amount
 * @returns {string}  e.g. "₹1,23,456"
 */
export function formatCurrency(amount, symbol = '₹') {
  return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Return a human-readable unit label for a product.
 */
export function unitLabel(product) {
  switch (product?.unitType) {
    case 'per_sqft': return 'sq ft';
    case 'per_rft':  return 'rft';
    case 'per_unit': return 'unit';
    default: return '';
  }
}
