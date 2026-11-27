import { describe, expect, it } from 'vitest';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { products } from '../src/data/products';
import { decodeFirestoreCatalogue, decodeFirestoreAudit, encodePublication } from '../src/lib/catalogue/firestore';
import { editableDraft, planPublication } from '../src/lib/catalogue/publication';
import type { Product } from '../src/lib/order/order';

const approved: Product[] = products.map(p => ({ ...p, pricingBasis: p.unit === 'g' ? 'kg' : p.unit }));
const stamp = new Timestamp(10, 123456000);
const fixture = () => ({
  schemaVersion: 1, revision: 1, updatedAt: stamp, operationId: 'bootstrap', acceptingRequests: true, showPrices: true,
  offers: Object.fromEntries(approved.map(p => [p.id, { enabled: true, pricePaise: 100000, priceVisibility: 'inherit', availability: 'available', stockQuantity: null, priceUpdatedAt: stamp, availabilityUpdatedAt: stamp }])),
});

describe('Firestore boundary', () => {
  it('normalizes only genuine timestamps and retains original precision for untouched offers', () => {
    const raw = fixture();
    const decoded = decodeFirestoreCatalogue(raw, approved);
    expect(decoded.catalogue.updatedAt).toBe(10123);
    expect(decoded.timestamps['paya'].price.isEqual(stamp)).toBe(true);
    expect(() => decodeFirestoreCatalogue({ ...raw, updatedAt: 10123 }, approved)).toThrow();
    expect(() => decodeFirestoreCatalogue({ ...raw, updatedAt: { seconds: 10, nanoseconds: 123000000 } }, approved)).toThrow();
    expect(() => decodeFirestoreCatalogue({ ...raw, private: true }, approved)).toThrow();
  });
  it('rejects future offer timestamps within the same millisecond', () => {
    const raw = fixture();
    raw.offers.paya.priceUpdatedAt = new Timestamp(10, 123999000);
    expect(() => decodeFirestoreCatalogue(raw, approved)).toThrow();
  });
  it('only accepts exact audit metadata and exact server timestamp equality', () => {
    const raw = fixture();
    const snapshot = { ...raw, revision: 2, operationId: 'op-1' };
    const audit = { actorUid: 'owner', previousRevision: 1, createdAt: stamp, snapshot };
    expect(decodeFirestoreAudit(audit, approved).snapshot.revision).toBe(2);
    expect(() => decodeFirestoreAudit({ ...audit, createdAt: new Timestamp(10, 123999000) }, approved)).toThrow();
    expect(() => decodeFirestoreAudit({ ...audit, previousRevision: 0 }, approved)).toThrow();
    expect(() => decodeFirestoreAudit({ ...audit, extra: true }, approved)).toThrow();
  });
  it('encodes changed fields with server timestamps while preserving untouched precision', () => {
    const decoded = decodeFirestoreCatalogue(fixture(), approved);
    const draft = editableDraft(decoded.catalogue);
    draft.offers.paya.pricePaise = 110000;
    draft.offers.boneless.stockQuantity = 500;
    const decision = planPublication(decoded.catalogue, { expectedRevision: 1, operationId: 'op-1', draft }, 'owner', null, approved);
    if (decision.kind !== 'write') throw Error('Expected write');
    const { catalogue, audit } = encodePublication(decoded, decision, 'owner');
    expect(catalogue.revision).toBe(2);
    expect(catalogue.offers.paya.priceUpdatedAt.isEqual(serverTimestamp())).toBe(true);
    expect(catalogue.offers.paya.availabilityUpdatedAt.isEqual(stamp)).toBe(true);
    expect(catalogue.offers.boneless.availabilityUpdatedAt.isEqual(serverTimestamp())).toBe(true);
    expect(catalogue.offers.boneless.priceUpdatedAt.isEqual(stamp)).toBe(true);
    expect(audit.snapshot).toEqual(catalogue);
    expect(audit.actorUid).toBe('owner');
  });
});
