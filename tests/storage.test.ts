import { describe, it, expect } from 'vitest';
import { RETENTION_MS, decodeDraft, encodeDraft } from '../src/lib/order/storage';
import { products } from '../src/data/products';

const items = [{ productId: 'mutton-bone', quantity: 500, note: 'private note' }];

describe('basket persistence', () => {
  it('stores only ids and quantities', () => {
    const raw = encodeDraft(items, 1000);
    expect(raw).not.toContain('private note');
    expect(decodeDraft(raw, products, 1001)).toEqual({ items: [{ productId: 'mutton-bone', quantity: 500, note: '' }], startedAt: 1000 });
  });
  it('expires exactly 24 h after the basket was started, however often it is edited', () => {
    const raw = encodeDraft(items, 1000); // re-saving an edited basket reuses startedAt
    expect(decodeDraft(raw, products, 1000 + RETENTION_MS)).not.toBeNull();
    expect(decodeDraft(raw, products, 1000 + RETENTION_MS + 1)).toBeNull();
  });
  it('rejects corrupted, future, empty and invalid drafts', () => {
    for (const raw of [
      '{', 'null', '{}', null,
      '{"version":1,"startedAt":1000,"items":[]}',
      '{"version":2,"startedAt":9000,"items":[{"productId":"mutton-bone","quantity":500}]}',
      '{"version":2,"startedAt":1000,"items":[]}',
      '{"version":2,"startedAt":1000,"items":[{"productId":"mutton-bone","quantity":-1}]}',
      '{"version":2,"startedAt":1000,"items":[{"productId":"mutton-bone","quantity":500},{"productId":"mutton-bone","quantity":500}]}',
    ]) expect(decodeDraft(raw, products, 2000)).toBeNull();
  });
});
