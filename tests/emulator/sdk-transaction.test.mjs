import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDocFromServer, Timestamp, disableNetwork, enableNetwork } from 'firebase/firestore';
import { products } from '../../src/data/products.ts';
import { getCatalogueFromServer, getActiveMembership, saveCatalogue } from '../../src/lib/catalogue/firestore.ts';
import { editableDraft } from '../../src/lib/catalogue/publication.ts';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8088') throw Error('Refusing non-local Firestore');
const approved = products.map(p => ({ ...p, pricingBasis: p.unit === 'g' ? 'kg' : p.unit }));
const stamp = new Timestamp(1, 123456000);
const fixture = () => ({
  schemaVersion: 1, revision: 1, updatedAt: stamp, operationId: 'bootstrap', acceptingRequests: true, showPrices: true,
  offers: Object.fromEntries(approved.map(p => [p.id, { enabled: true, pricePaise: 100000, priceVisibility: 'inherit', availability: 'available', stockQuantity: null, priceUpdatedAt: stamp, availabilityUpdatedAt: stamp }])),
});
let env;
const owner = () => env.authenticatedContext('owner').firestore();
const publicDb = () => env.unauthenticatedContext().firestore();
const currentRef = db => doc(db, 'public', 'catalogue');
const auditRef = (db, id) => doc(db, 'audit', id);
async function intent(db, id) {
  const current = await getCatalogueFromServer(db, approved);
  return { expectedRevision: current.revision, operationId: id, draft: editableDraft(current) };
}

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-moin-security', firestore: {
    host: '127.0.0.1', port: 8088,
    rules: readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8'),
  } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([setDoc(currentRef(db), fixture()), setDoc(doc(db, 'admins', 'owner'), { active: true }), setDoc(doc(db, 'admins', 'second'), { active: true })]);
  });
});
afterAll(async () => { await env?.cleanup(); });

describe('real Firestore Web SDK transaction', () => {
  it('reads public catalogue from server and verifies membership privately', async () => {
    expect((await getCatalogueFromServer(publicDb(), approved)).revision).toBe(1);
    expect(await getActiveMembership(owner(), 'owner')).toBe(true);
    const other = env.authenticatedContext('other').firestore();
    expect(await getActiveMembership(other, 'other')).toBe(false);
    await expect(getActiveMembership(other, 'owner')).rejects.toThrow();
  });
  it('atomically saves all 13 offers with a matching audit and genuine server timestamps', async () => {
    const db = owner();
    const change = await intent(db, 'all-13');
    for (const offer of Object.values(change.draft.offers)) { offer.pricePaise += 1000; offer.stockQuantity = 100; }
    expect(await saveCatalogue(db, 'owner', change, approved)).toEqual({ kind: 'saved', revision: 2 });
    const raw = (await getDocFromServer(currentRef(db))).data();
    const audit = (await getDocFromServer(auditRef(db, 'all-13'))).data();
    expect(Object.keys(raw.offers)).toHaveLength(13);
    expect(audit.snapshot).toEqual(raw);
    expect(audit.createdAt.isEqual(raw.updatedAt)).toBe(true);
    for (const offer of Object.values(raw.offers)) {
      expect(offer.priceUpdatedAt.isEqual(raw.updatedAt)).toBe(true);
      expect(offer.availabilityUpdatedAt.isEqual(raw.updatedAt)).toBe(true);
    }
  });
  it('retains untouched nanosecond timestamps and recovers an already committed operation', async () => {
    const db = owner();
    const first = await intent(db, 'first');
    first.draft.offers.paya.pricePaise += 1000;
    await saveCatalogue(db, 'owner', first, approved);
    const raw = (await getDocFromServer(currentRef(db))).data();
    expect(raw.offers.paya.availabilityUpdatedAt.isEqual(stamp)).toBe(true);
    expect(raw.offers.boneless.priceUpdatedAt.isEqual(stamp)).toBe(true);
    const second = await intent(db, 'second');
    second.draft.showPrices = false;
    await saveCatalogue(db, 'owner', second, approved);
    expect(await saveCatalogue(db, 'owner', first, approved)).toEqual({ kind: 'already_committed', revision: 2 });
    expect((await getCatalogueFromServer(db, approved)).revision).toBe(3);
    first.draft.offers.paya.pricePaise += 1000;
    await expect(saveCatalogue(db, 'owner', first, approved)).rejects.toThrow();
  });
  it('does not overwrite a competing editor with a stale revision', async () => {
    const firstDb = owner(), secondDb = env.authenticatedContext('second').firestore();
    const first = await intent(firstDb, 'first'), second = await intent(secondDb, 'second');
    first.draft.showPrices = false; second.draft.acceptingRequests = false;
    expect(await saveCatalogue(firstDb, 'owner', first, approved)).toEqual({ kind: 'saved', revision: 2 });
    expect(await saveCatalogue(secondDb, 'second', second, approved)).toEqual({ kind: 'conflict', revision: 2 });
    const current = await getCatalogueFromServer(firstDb, approved);
    expect(current.acceptingRequests).toBe(true);
    expect((await getDocFromServer(auditRef(firstDb, 'second'))).exists()).toBe(false);
  });
  it('blocks revoked and non-member administrators, including previously authenticated users', async () => {
    const db = owner();
    const request = await intent(db, 'revoked');
    request.draft.showPrices = false;
    await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'admins', 'owner'), { active: false }));
    expect(await getActiveMembership(db, 'owner')).toBe(false);
    await expect(saveCatalogue(db, 'owner', request, approved)).rejects.toThrow();
    const other = env.authenticatedContext('other').firestore();
    await expect(saveCatalogue(other, 'other', request, approved)).rejects.toThrow();
    expect((await getCatalogueFromServer(publicDb(), approved)).revision).toBe(1);
  });
  it('does not trust cached public data when the server is unavailable', async () => {
    const db = publicDb();
    await getCatalogueFromServer(db, approved);
    await disableNetwork(db);
    try { await expect(getCatalogueFromServer(db, approved)).rejects.toThrow(); }
    finally { await enableNetwork(db); }
  });
  it('does not write unchanged drafts or drafts with unconfirmed charging metadata', async () => {
    const db = owner(); const request = await intent(db, 'noop');
    expect(await saveCatalogue(db, 'owner', request, approved)).toEqual({ kind: 'unchanged', revision: 1 });
    request.draft.showPrices = false;
    await expect(saveCatalogue(db, 'owner', request, products)).rejects.toThrow('Catalogue not ready');
    expect((await getCatalogueFromServer(db, approved)).revision).toBe(1);
  });
});
