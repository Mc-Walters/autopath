import { OrderRecord } from '../types';

/**
 * Only rejects broken records (not an object / no order id). Real orders are NEVER
 * hidden because of what the customer typed (name, company, city, email...).
 * (An older version of the site hid orders that looked like Gemini's sample
 * order, which silently removed real customer orders. That filter is gone.)
 */
export const isMockupOrder = (o: any): boolean => {
  if (!o || typeof o !== 'object') return true;
  if (!o.orderId) return true;
  return false;
};

// Statuses that only ever happen AFTER a payment screenshot was verified.
const PAID_STATUSES = [
  'Payment Successful',
  'Packaging of Goods',
  'Sending & Transportation',
  'Air Delivery',
  'Delivered',
];

/** PAID = the payment screenshot was verified as successful. */
export const isPaidOrder = (o: OrderRecord): boolean =>
  o.paymentVerified === true || PAID_STATUSES.includes(o.status);

/** PENDING = anything that has not been successfully paid yet. */
export const isPendingOrder = (o: OrderRecord): boolean => !isPaidOrder(o);

/** Adds an order to the list (newest first) without ever creating duplicates. */
export const upsertOrder = (list: OrderRecord[], order: OrderRecord): OrderRecord[] => {
  const exists = list.some((o) => o.orderId === order.orderId);
  return exists
    ? list.map((o) => (o.orderId === order.orderId ? { ...o, ...order } : o))
    : [order, ...list];
};

/** Merges several lists of orders into one (newest first), keeping the most advanced copy of each. */
export const mergeOrders = (...lists: OrderRecord[][]): OrderRecord[] => {
  const map = new Map<string, OrderRecord>();
  for (const list of lists) {
    for (const o of list || []) {
      if (!o || isMockupOrder(o)) continue;
      const prev = map.get(o.orderId);
      // a paid copy always wins over an unpaid copy of the same order
      if (!prev || (isPaidOrder(o) && !isPaidOrder(prev))) map.set(o.orderId, o);
    }
  }
  return Array.from(map.values());
};
