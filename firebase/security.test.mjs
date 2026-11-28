import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const projectId = 'demo-moin-security';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8088') {
  throw new Error('Refusing to run against anything except the local Firestore emulator on port 8088.');
}
const ids = ['mutton-bone', 'boneless', 'leg', 'liver', 'liver-set', 'kidney', 'boti', 'brain', 'head', 'paya', 'live-chicken', 'skinless', 'desi'];
const oldTime = Timestamp.fromMillis(1000);
const fixture = () => ({
  schemaVersion: 1, revision: 1, updatedAt: oldTime, operationId: 'bootstrap',
  acceptingRequests: true, showPrices: true,
  offers: Object.fromEntries(ids.map(id => [id, {
    enabled: true, pricePaise: 100000, priceVisibility: 'inherit',
    availability: 'available', stockQuantity: null,
    priceUpdatedAt: oldTime, availabilityUpdatedAt: oldTime,
  }])),
});
const next = (operationId = 'op-1') => {
  const value = fixture();
  value.revision = 2;
  value.operationId = operationId;
  value.updatedAt = serverTimestamp();
  for (const offer of Object.values(value.offers)) {
    offer.pricePaise = 110000;
    offer.stockQuantity = 100;
    offer.priceUpdatedAt = serverTimestamp();
    offer.availabilityUpdatedAt = serverTimestamp();
  }
  return value;
};
let env;
const owner = () => env.authenticatedContext('owner').firestore();
const anonymous = () => env.unauthenticatedContext().firestore();
const catalogue = db => doc(db, 'public', 'catalogue');
const audit = (db, id) => doc(db, 'audit', id);
const auditValue = (value, actorUid = 'owner') => ({
  actorUid, createdAt: serverTimestamp(), previousRevision: value.revision - 1, snapshot: value,
});
function publish(db, value = next(), record = auditValue(value)) {
  const batch = writeBatch(db);
  batch.set(catalogue(db), value);
  batch.set(audit(db, value.operationId), record);
  return batch.commit();
}

before(async () => {
  const rules = process.env.RULES_DENY_ALL === '1'
    ? "rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if false; } } }"
    : readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');
  env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8088, rules } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(catalogue(db), fixture()),
      setDoc(doc(db, 'admins', 'owner'), { active: true }),
      setDoc(doc(db, 'admins', 'revoked'), { active: false }),
      setDoc(doc(db, 'private', 'secret'), { private: true }),
    ]);
  });
});
after(async () => { await env?.cleanup(); });

test('authorised owner publishes all 13 offers with matching audit atomically', async () => {
  const db = owner();
  await assertSucceeds(publish(db));
  const result = (await assertSucceeds(getDoc(catalogue(db)))).data();
  const record = (await assertSucceeds(getDoc(audit(db, 'op-1')))).data();
  assert.equal(result.revision, 2);
  assert.equal(Object.keys(result.offers).length, 13);
  assert.equal(record.actorUid, 'owner');
  assert.equal(record.previousRevision, 1);
  assert.deepEqual(record.snapshot, result);
  assert.ok(record.createdAt.isEqual(result.updatedAt));
});
test('public can get only the known public catalogue, not list or read private records', async () => {
  const db = anonymous();
  await assertSucceeds(getDoc(catalogue(db)));
  await assertFails(getDocs(collection(db, 'public')));
  await assertFails(getDoc(doc(db, 'admins', 'owner')));
  await assertFails(getDoc(audit(db, 'op-1')));
  await assertFails(getDoc(doc(db, 'private', 'secret')));
});
test('anonymous, non-member and revoked administrators cannot publish', async () => {
  for (const db of [anonymous(), env.authenticatedContext('other').firestore(), env.authenticatedContext('revoked').firestore()]) {
    await assertFails(publish(db));
  }
});
test('membership is private and cannot be self-granted, changed or deleted', async () => {
  const db = owner();
  await assertSucceeds(getDoc(doc(db, 'admins', 'owner')));
  await assertFails(getDoc(doc(db, 'admins', 'revoked')));
  await assertFails(getDocs(collection(db, 'admins')));
  await assertFails(updateDoc(doc(db, 'admins', 'owner'), { active: false }));
  await assertFails(deleteDoc(doc(db, 'admins', 'owner')));
  const other = env.authenticatedContext('other').firestore();
  await assertFails(setDoc(doc(other, 'admins', 'other'), { active: true }));
});
test('catalogue and audit cannot be created separately, deleted or rewritten', async () => {
  const db = owner();
  const value = next();
  await assertFails(setDoc(catalogue(db), value));
  await assertFails(setDoc(audit(db, value.operationId), auditValue(value)));
  await assertFails(deleteDoc(catalogue(db)));
  await assertSucceeds(publish(db, value));
  await assertFails(updateDoc(audit(db, value.operationId), { actorUid: 'other' }));
  await assertFails(deleteDoc(audit(db, value.operationId)));
  await assertFails(publish(db, value));
});
test('audit actor, snapshot, previous revision and timestamp must match publication', async () => {
  const db = owner();
  const value = next();
  await assertFails(publish(db, value, auditValue(value, 'other')));
  await assertFails(publish(db, value, { ...auditValue(value), previousRevision: 0 }));
  await assertFails(publish(db, value, { ...auditValue(value), createdAt: oldTime }));
  await assertFails(publish(db, value, { ...auditValue(value), snapshot: { ...value, showPrices: false } }));
  await assertFails(publish(db, value, { ...auditValue(value), extra: true }));
});
test('stale revision and forged timestamps are denied', async () => {
  const db = owner();
  await assertFails(publish(db, { ...next(), revision: 3 }));
  await assertFails(publish(db, { ...next(), updatedAt: oldTime }));
  const value = next();
  value.offers['mutton-bone'].priceUpdatedAt = oldTime;
  await assertFails(publish(db, value));
  const value2 = next();
  value2.offers['mutton-bone'].availabilityUpdatedAt = oldTime;
  await assertFails(publish(db, value2));
});
test('exact schema, offer IDs, types, numeric bounds and explicit ask rates are enforced', async () => {
  const db = owner();
  const badValues = [
    v => { v.actorUid = 'private'; },
    v => { delete v.showPrices; },
    v => { v.acceptingRequests = 'true'; },
    v => { v.operationId = 'bad.id'; },
    v => { delete v.offers.paya; },
    v => { v.offers.extra = v.offers.paya; },
    v => { v.offers.paya.extra = 1; },
    v => { v.offers.paya.pricePaise = null; },
    v => { v.offers.paya.pricePaise = 0; },
    v => { v.offers.paya.pricePaise = 10000001; },
    v => { v.offers.paya.pricePaise = 1.5; },
    v => { v.offers.paya.stockQuantity = -1; },
    v => { v.offers.paya.stockQuantity = 1000000001; },
    v => { v.offers.paya.availability = 'yes'; },
    v => { v.offers.paya.priceVisibility = 'hidden'; },
  ];
  for (const mutate of badValues) {
    const value = next();
    mutate(value);
    await assertFails(publish(db, value));
  }
  const value = next();
  value.offers.paya.pricePaise = null;
  value.offers.paya.priceVisibility = 'ask';
  value.offers.paya.stockQuantity = 0;
  await assertSucceeds(publish(db, value));
});
test('unchanged fields may retain their earlier timestamps while revision advances', async () => {
  const db = owner();
  const value = { ...fixture(), revision: 2, operationId: 'op-unchanged', updatedAt: serverTimestamp(), showPrices: false };
  await assertSucceeds(publish(db, value));
});

test('every offer in both validation partitions rejects invalid prices', async () => {
  const db = owner();
  for (const id of ids) {
    const value = next();
    value.offers[id].pricePaise = -1;
    await assertFails(publish(db, value));
  }
  await assertSucceeds(publish(db));
});

test('active membership must be a literal boolean and never grants collection or private writes', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'admins', 'malformed'), { active: 'true' });
  });
  await assertFails(publish(env.authenticatedContext('malformed').firestore()));
  const db = owner();
  await assertFails(getDocs(collection(db, 'audit')));
  await assertFails(getDoc(doc(db, 'private', 'secret')));
  await assertFails(setDoc(doc(db, 'public', 'another'), fixture()));
  await assertFails(setDoc(doc(db, 'private', 'another'), { active: true }));
  await assertSucceeds(publish(db));
});
test('an existing operation ID cannot be reused with a newer revision', async () => {
  const db = owner();
  await assertSucceeds(publish(db));
  const value = next('op-1');
  value.revision = 3;
  await assertFails(publish(db, value));
  const after = (await assertSucceeds(getDoc(catalogue(db)))).data();
  assert.equal(after.revision, 2);
});
