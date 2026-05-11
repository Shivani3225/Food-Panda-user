export function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function buildCartLineId({
  restaurantId,
  menuItemId,
  selectedFlavorId,
  addOnIds,
}) {
  const safeRestaurantId = String(restaurantId ?? 'na');
  const safeMenuItemId = String(menuItemId ?? 'na');
  const safeFlavorId = String(selectedFlavorId ?? 'none');
  const sortedAddOns = Array.isArray(addOnIds)
    ? [...addOnIds].map(String).sort()
    : [];

  return `${safeRestaurantId}:${safeMenuItemId}:${safeFlavorId}:${sortedAddOns.join(
    ',',
  )}`;
}

export function calculateCartLineTotals({
  basePrice,
  selectedFlavor,
  addOns,
  quantity,
}) {
  const base = toNumber(basePrice, 0);
  const flavorDelta = selectedFlavor
    ? toNumber(selectedFlavor.priceDelta, 0)
    : 0;
  const extras = (Array.isArray(addOns) ? addOns : []).reduce(
    (sum, a) => sum + toNumber(a.price, 0),
    0,
  );

  const unitTotal = base + flavorDelta + extras;
  const qty = Math.max(1, toNumber(quantity, 1));
  const totalPrice = unitTotal * qty;

  return { unitTotal, totalPrice };
}

export function calculateCartTotals(cartItems, fees = {}) {
  const items = Array.isArray(cartItems) ? cartItems : [];

  const subtotal = items.reduce(
    (sum, it) => sum + toNumber(it.totalPrice ?? it.price, 0),
    0,
  );

  const delivery = toNumber(fees.delivery, 0);
  const tax = toNumber(fees.tax, 0);
  const discount = toNumber(fees.discount, 0);

  const grandTotal = subtotal + delivery + tax - discount;

  return {
    subtotal,
    delivery,
    tax,
    discount,
    grandTotal,
  };
}
