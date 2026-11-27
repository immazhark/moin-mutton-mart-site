import { describe, expect, it } from 'vitest';
import { products } from '../src/data/products';
import { parseCatalogue } from '../src/lib/catalogue/contract';
import { editableDraft, planPublication, type AuditRecord } from '../src/lib/catalogue/publication';
import type { Product } from '../src/lib/order/order';

const approved: Product[] = products.map(p => ({ ...p, pricingBasis: p.unit === 'g' ? 'kg' : p.unit }));
const current = () => parseCatalogue({ schemaVersion: 1, revision: 1, updatedAt: 100, operationId: 'bootstrap', acceptingRequests: true, showPrices: true, offers: Object.fromEntries(products.map(p => [p.id, { enabled: true, pricePaise: 100_000, priceVisibility: 'inherit', availability: 'available', stockQuantity: null, priceUpdatedAt: 100, availabilityUpdatedAt: 100 }])) }, approved);
const intent = (c = current()) => ({ expectedRevision: c.revision, operationId: 'new-operation', draft: editableDraft(c) });
const actor = 'fixture-owner';

describe('publication decision', () => {
  it('identifies rate and availability changes independently across all offers', () => {
    const c = current(); const request = intent(c);
    request.draft.offers.paya.pricePaise = 110_000;
    request.draft.offers.boneless.stockQuantity = 500;
    const result = planPublication(c, request, actor, null, approved);
    expect(result.kind).toBe('write');
    if (result.kind !== 'write') throw new Error('Expected write');
    expect(result.revision).toBe(2);
    expect(result.priceChangedIds).toEqual(['paya']);
    expect(result.availabilityChangedIds).toEqual(['boneless']);
    expect(c.offers.paya.pricePaise).toBe(100_000);
  });
  it('detects no-op edits without creating a revision', () => {
    const c = current();
    expect(planPublication(c, intent(c), actor, null, approved)).toEqual({ kind: 'unchanged', revision: 1 });
  });
  it('blocks stale drafts before writing', () => {
    const c = current(); const request = intent(c);
    expect(planPublication({ ...c, revision: 2 }, request, actor, null, approved)).toEqual({ kind: 'conflict', revision: 2 });
  });
  it('recovers a committed operation even after a later revision', () => {
    const c = current(); const request = intent(c); request.draft.showPrices = false;
    const snapshot = { ...c, revision: 2, operationId: request.operationId, updatedAt: 200, showPrices: false };
    const record: AuditRecord = { actorUid: actor, previousRevision: 1, createdAt: 200, snapshot };
    expect(planPublication({ ...snapshot, revision: 3, operationId: 'later-op', updatedAt: 300 }, request, actor, record, approved)).toEqual({ kind: 'already_committed', revision: 2 });
    expect(() => planPublication(snapshot, request, 'other-owner', record, approved)).toThrow();
    expect(() => planPublication(snapshot, { ...request, draft: { ...request.draft, showPrices: true } }, actor, record, approved)).toThrow();
    expect(() => planPublication(snapshot, request, actor, { ...record, createdAt: 199 }, approved)).toThrow();
    const inconsistent = { ...snapshot, offers: { ...snapshot.offers, paya: { ...snapshot.offers.paya, priceUpdatedAt: 200 } } };
    expect(() => planPublication(inconsistent, request, actor, record, approved)).toThrow();
  });
  it('rejects malformed IDs and revision overflow', () => {
    const c = current(); const request = intent(c);
    expect(() => planPublication(c, { ...request, operationId: 'bad.id' }, actor, null, approved)).toThrow();
    expect(() => planPublication(c, { ...request, expectedRevision: Number.MAX_SAFE_INTEGER }, actor, null, approved)).toThrow();
  });
  it('rejects injected metadata, missing prices and unconfirmed charging basis', () => {
    const c = current(); const request = intent(c);
    expect(() => planPublication(c, { ...request, draft: { ...request.draft, actorUid: actor } }, actor, null, approved)).toThrow();
    request.draft.offers.paya.pricePaise = null;
    expect(() => planPublication(c, request, actor, null, approved)).toThrow();
    request.draft.offers.paya.priceVisibility = 'ask';
    expect(planPublication(c, request, actor, null, approved).kind).toBe('write');
    expect(() => planPublication(c, request, actor, null, products)).toThrow();
  });
  it('returns an isolated draft snapshot, not a mutable alias', () => {
    const c = current(); const request = intent(c); request.draft.showPrices = false;
    const result = planPublication(c, request, actor, null, approved);
    if (result.kind !== 'write') throw new Error('Expected write');
    request.draft.offers.paya.pricePaise = 123;
    expect(result.draft.offers.paya.pricePaise).toBe(100_000);
  });
});
