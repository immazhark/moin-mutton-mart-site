import {
  doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp,
  type Firestore, type FieldValue,
} from 'firebase/firestore';
import { parseCatalogue, type Catalogue } from './contract';
import { planPublication, type AuditRecord, type EditableOffer, type PublicationDecision, type SaveIntent } from './publication';
import type { Product } from '../order/order';

type OfferTimestamps = { price: Timestamp; availability: Timestamp };
export interface DecodedCatalogue {
  catalogue: Catalogue;
  updatedAt: Timestamp;
  timestamps: Record<string, OfferTimestamps>;
}
function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw Error('Invalid Firestore ' + field);
  return value as Record<string, unknown>;
}
function timestamp(value: unknown): Timestamp {
  if (!(value instanceof Timestamp) || value.seconds < 0) throw Error('Invalid Firestore timestamp');
  return value;
}
function millis(value: Timestamp): number {
  return Math.floor(value.toMillis());
}
function after(a: Timestamp, b: Timestamp): boolean {
  return a.seconds > b.seconds || (a.seconds === b.seconds && a.nanoseconds > b.nanoseconds);
}

export function decodeFirestoreCatalogue(value: unknown, products: readonly Product[]): DecodedCatalogue {
  const raw = record(value, 'catalogue');
  const updatedAt = timestamp(raw.updatedAt);
  const timestamps: Record<string, OfferTimestamps> = Object.create(null);
  const offers = Object.fromEntries(Object.entries(record(raw.offers, 'offers')).map(([id, value]) => {
    const offer = record(value, 'offer');
    const price = timestamp(offer.priceUpdatedAt);
    const availability = timestamp(offer.availabilityUpdatedAt);
    if (after(price, updatedAt) || after(availability, updatedAt)) throw Error('Offer timestamp exceeds catalogue update');
    timestamps[id] = { price, availability };
    return [id, { ...offer, priceUpdatedAt: millis(price), availabilityUpdatedAt: millis(availability) }];
  }));
  return { catalogue: parseCatalogue({ ...raw, updatedAt: millis(updatedAt), offers }, products), updatedAt, timestamps };
}

function decodeAudit(value: unknown, products: readonly Product[]) {
  const raw = record(value, 'audit');
  const keys = ['actorUid', 'previousRevision', 'createdAt', 'snapshot'];
  if (Reflect.ownKeys(raw).length !== keys.length || !keys.every(key => Object.hasOwn(raw, key))) throw Error('Invalid audit shape');
  const snapshot = decodeFirestoreCatalogue(raw.snapshot, products);
  const createdAt = timestamp(raw.createdAt);
  if (typeof raw.actorUid !== 'string' || !raw.actorUid || !Number.isSafeInteger(raw.previousRevision) ||
    raw.previousRevision !== snapshot.catalogue.revision - 1 || snapshot.catalogue.revision < 2 ||
    !createdAt.isEqual(snapshot.updatedAt)) throw Error('Invalid audit metadata');
  const audit: AuditRecord = { actorUid: raw.actorUid, previousRevision: snapshot.catalogue.revision - 1, createdAt: millis(createdAt), snapshot: snapshot.catalogue };
  return { audit, snapshot };
}
export function decodeFirestoreAudit(value: unknown, products: readonly Product[]): AuditRecord {
  return decodeAudit(value, products).audit;
}
type WriteDecision = Extract<PublicationDecision, { kind: 'write' }>;
type EncodedOffer = EditableOffer & { priceUpdatedAt: Timestamp | FieldValue; availabilityUpdatedAt: Timestamp | FieldValue };
export function encodePublication(current: DecodedCatalogue, decision: WriteDecision, actorUid: string) {
  const priceChanged = new Set(decision.priceChangedIds);
  const availabilityChanged = new Set(decision.availabilityChangedIds);
  const now = serverTimestamp();
  const offers: Record<string, EncodedOffer> = Object.fromEntries(Object.entries(decision.draft.offers).map(([id, offer]) => [
    id, { ...offer, priceUpdatedAt: priceChanged.has(id) ? now : current.timestamps[id].price,
      availabilityUpdatedAt: availabilityChanged.has(id) ? now : current.timestamps[id].availability },
  ]));
  const catalogue = { schemaVersion: 1, revision: decision.revision, updatedAt: now, operationId: decision.operationId,
    acceptingRequests: decision.draft.acceptingRequests, showPrices: decision.draft.showPrices, offers };
  return { catalogue, audit: { actorUid, previousRevision: current.catalogue.revision, createdAt: now, snapshot: catalogue } };
}
function checkUid(uid: string): void {
  if (typeof uid !== 'string' || !uid || uid.length > 128 || uid.includes('/')) throw Error('Invalid administrator identity');
}
function active(value: unknown): boolean {
  return typeof value === 'object' && value !== null && Object.hasOwn(value, 'active') && (value as { active?: unknown }).active === true;
}
function requireServer(snapshot: { metadata: { fromCache: boolean; hasPendingWrites: boolean } }): void {
  if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) throw Error('Fresh server data unavailable');
}
export async function getCatalogueFromServer(db: Firestore, products: readonly Product[]): Promise<Catalogue> {
  const snapshot = await getDocFromServer(doc(db, 'public', 'catalogue'));
  requireServer(snapshot);
  if (!snapshot.exists()) throw Error('Catalogue has not been provisioned');
  return decodeFirestoreCatalogue(snapshot.data(), products).catalogue;
}
export async function getActiveMembership(db: Firestore, uid: string): Promise<boolean> {
  checkUid(uid);
  const snapshot = await getDocFromServer(doc(db, 'admins', uid));
  requireServer(snapshot);
  return snapshot.exists() && active(snapshot.data());
}

export type SaveResult = Exclude<PublicationDecision, WriteDecision> | { kind: 'saved'; revision: number };
/** Online Firestore transaction. Caller retains its operation ID and exact draft if
 * outcome is uncertain; retry that same intent, never generate a replacement ID.
 * Rules enforce membership independently of all client checks. */
export async function saveCatalogue(db: Firestore, uid: string, intent: SaveIntent, products: readonly Product[]): Promise<SaveResult> {
  checkUid(uid);
  if (typeof intent.operationId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(intent.operationId)) throw Error('Invalid operation ID');
  // Freeze the submitted intent before the async transaction or SDK retry.
  const request = { expectedRevision: intent.expectedRevision, operationId: intent.operationId, draft: structuredClone(intent.draft) };
  const memberRef = doc(db, 'admins', uid);
  const catalogueRef = doc(db, 'public', 'catalogue');
  const auditRef = doc(db, 'audit', request.operationId);
  return runTransaction(db, async (transaction): Promise<SaveResult> => {
    const member = await transaction.get(memberRef);
    if (!member.exists() || !active(member.data())) throw Error('Administrator access required');
    const current = await transaction.get(catalogueRef);
    const operation = await transaction.get(auditRef);
    if (!current.exists()) throw Error('Catalogue has not been provisioned');
    const decoded = decodeFirestoreCatalogue(current.data(), products);
    const previous = operation.exists() ? decodeAudit(operation.data(), products) : null;
    if (previous && previous.snapshot.catalogue.revision === decoded.catalogue.revision) {
      if (!previous.snapshot.updatedAt.isEqual(decoded.updatedAt) || products.some(({ id }) =>
        !previous.snapshot.timestamps[id].price.isEqual(decoded.timestamps[id].price) ||
        !previous.snapshot.timestamps[id].availability.isEqual(decoded.timestamps[id].availability))) throw Error('Inconsistent audit timestamps');
    }
    const decision = planPublication(decoded.catalogue, request, uid, previous?.audit ?? null, products);
    if (decision.kind !== 'write') return decision;
    const encoded = encodePublication(decoded, decision, uid);
    transaction.set(catalogueRef, encoded.catalogue);
    transaction.set(auditRef, encoded.audit);
    return { kind: 'saved', revision: decision.revision };
  }, { maxAttempts: 3 });
}
