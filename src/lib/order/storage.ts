import { validateSelection, type Product, type Selection } from './order';

export const STORAGE_KEY = 'moin-request-v2';
export const RETENTION_MS = 24 * 60 * 60 * 1000;

export interface Draft {
  items: Selection[];
  /** When the basket was first started. Edits never move it, so retention is a fixed 24 h. */
  startedAt: number;
}

/** Only product ids and quantities are stored: no notes, contact details, prices or identity. */
export function encodeDraft(items: Selection[], startedAt: number): string {
  return JSON.stringify({
    version: 2,
    startedAt,
    items: items.map(({ productId, quantity }) => ({ productId, quantity })),
  });
}

export function decodeDraft(raw: string | null, products: readonly Product[], now = Date.now()): Draft | null {
  try {
    if (!raw || raw.length > 10_000) return null;
    const v = JSON.parse(raw);
    if (
      v.version !== 2 ||
      !Number.isSafeInteger(v.startedAt) ||
      v.startedAt > now ||
      now - v.startedAt > RETENTION_MS ||
      !Array.isArray(v.items) ||
      v.items.length === 0 ||
      v.items.length > products.length
    ) {
      return null;
    }
    const seen = new Set<string>();
    const items = v.items.map((i: { productId: string; quantity: number }) => {
      const s: Selection = { productId: i.productId, quantity: i.quantity, note: '' };
      validateSelection(products, s);
      if (seen.has(s.productId)) throw new Error('Duplicate');
      seen.add(s.productId);
      return s;
    });
    return { items, startedAt: v.startedAt };
  } catch {
    return null;
  }
}
