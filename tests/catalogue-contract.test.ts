import { describe, expect, it } from 'vitest';
import { products } from '../src/data/products';
import { parseCatalogue, publicationProblems, displayedRate, assessQuantity } from '../src/lib/catalogue/contract';
import type { Product } from '../src/lib/order/order';

// Synthetic fixture; never seed or publish these values to the real shop.
const approved: Product[] = products.map((p) => ({ ...p, pricingBasis: p.unit === 'g' ? 'kg' : p.unit }));
const offer = () => ({ enabled: true, pricePaise: 100_000, priceVisibility: 'inherit', availability: 'available', stockQuantity: 1500 as number | null, priceUpdatedAt: 100, availabilityUpdatedAt: 100 });
const fixture = () => ({ schemaVersion: 1, revision: 1, updatedAt: 100, operationId: 'test-operation-001', acceptingRequests: true, showPrices: true, offers: Object.fromEntries(products.map((p) => [p.id, offer()])) });

describe('catalogue boundary', () => {
  it('accepts all 13 offers and allows explicit unknown stock', () => {
    const input = fixture();
    input.offers['mutton-bone'].stockQuantity = null;
    const catalogue = parseCatalogue(input, approved);
    expect(Object.keys(catalogue.offers).length).toBe(13);
    expect(catalogue.offers['mutton-bone'].stockQuantity).toBe(null);
  });
  it('rejects missing, extra and malformed fields, invalid product IDs and actor identity', () => {
    for (const input of [
      { ...fixture(), actorUid: 'private' },
      { ...fixture(), revision: 1.5 },
      { ...fixture(), updatedAt: Infinity },
      { ...fixture(), operationId: '../other' },
      { ...fixture(), showPrices: 'true' },
      { ...fixture(), offers: { ...fixture().offers, other: offer() } },
      { ...fixture(), offers: {} },
      { ...fixture(), offers: { ...fixture().offers, 'mutton-bone': { ...offer(), pricePaise: -1 } } },
      { ...fixture(), offers: { ...fixture().offers, 'mutton-bone': { ...offer(), stockQuantity: 1.5 } } },
      { ...fixture(), offers: { ...fixture().offers, 'mutton-bone': { ...offer(), availability: 'yes' } } },
      { ...fixture(), offers: { ...fixture().offers, 'mutton-bone': { ...offer(), priceUpdatedAt: 101 } } },
      { ...fixture(), offers: { ...fixture().offers, 'mutton-bone': { ...offer(), unexpected: true } } },
    ]) expect(() => parseCatalogue(input, approved)).toThrow();
  });
  it('does not turn an absent rate into an intentional ask-rate setting', () => {
    const raw = fixture();
    const id = 'mutton-bone';
    const input = { ...raw, showPrices: false, offers: { ...raw.offers, [id]: { ...offer(), pricePaise: null } } };
    const catalogue = parseCatalogue(input, approved);
    expect(displayedRate(catalogue, id)).toEqual({ kind: 'missing' });
    expect(publicationProblems(catalogue, approved).length).toBe(1);
    const explicit = parseCatalogue({ ...input, offers: { ...input.offers, [id]: { ...input.offers[id], priceVisibility: 'ask' } } }, approved);
    expect(displayedRate(explicit, id)).toEqual({ kind: 'ask' });
    expect(publicationProblems(explicit, approved)).toEqual([]);
  });
  it('blocks publication with unconfirmed charging units even if prices are present', () => {
    const catalogue = parseCatalogue(fixture(), products);
    expect(publicationProblems(catalogue, products).length).toBe(13);
  });
  it('respects explicit visibility overrides without modifying saved prices', () => {
    const raw = fixture();
    const catalogue = parseCatalogue({ ...raw, showPrices: false, offers: { ...raw.offers, 'mutton-bone': { ...offer(), priceVisibility: 'show' } } }, approved);
    expect(displayedRate(catalogue, 'mutton-bone')).toEqual({ kind: 'visible', pricePaise: 100_000 });
    expect(displayedRate(catalogue, 'boneless')).toEqual({ kind: 'ask' });
    expect(catalogue.offers.boneless.pricePaise).toBe(100_000);
  });
  it('blocks zero/insufficient stock and invalid increments without reserving stock', () => {
    const raw = fixture();
    const p = approved[0];
    const catalogue = parseCatalogue(raw, approved);
    expect(assessQuantity(catalogue, p, 500)).toEqual({ kind: 'requestable', confirmationRequired: false });
    expect(assessQuantity(catalogue, p, 501)).toEqual({ kind: 'blocked', reason: 'invalid_quantity' });
    expect(assessQuantity(catalogue, p, 2000)).toEqual({ kind: 'blocked', reason: 'insufficient_stock' });
    expect(catalogue.offers[p.id].stockQuantity).toBe(1500);
    for (const stockQuantity of [0, null]) {
      const next = parseCatalogue({ ...raw, offers: { ...raw.offers, [p.id]: { ...offer(), stockQuantity } } }, approved);
      expect(assessQuantity(next, p, 500)).toEqual(stockQuantity === 0 ? { kind: 'blocked', reason: 'insufficient_stock' } : { kind: 'requestable', confirmationRequired: true });
    }
  });
  it('blocks disabled products, explicit sold-out state and closed request intake', () => {
    const raw = fixture();
    const p = approved[0];
    for (const [change, reason] of [[{ enabled: false }, 'disabled'], [{ availability: 'sold_out' }, 'sold_out']] as const) {
      const c = parseCatalogue({ ...raw, offers: { ...raw.offers, [p.id]: { ...offer(), ...change } } }, approved);
      expect(assessQuantity(c, p, 500)).toEqual({ kind: 'blocked', reason });
    }
    expect(assessQuantity(parseCatalogue({ ...raw, acceptingRequests: false }, approved), p, 500)).toEqual({ kind: 'blocked', reason: 'closed' });
  });
});
