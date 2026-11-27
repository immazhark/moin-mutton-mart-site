import { parseCatalogue, publicationProblems, type Catalogue, type Offer } from './contract';
import type { Product } from '../order/order';

export type EditableOffer = Pick<Offer, 'enabled' | 'pricePaise' | 'priceVisibility' | 'availability' | 'stockQuantity'>;
export interface CatalogueDraft { acceptingRequests: boolean; showPrices: boolean; offers: Record<string, EditableOffer> }
export interface SaveIntent { expectedRevision: number; operationId: string; draft: unknown }
export interface AuditRecord { actorUid: string; previousRevision: number; createdAt: number; snapshot: Catalogue }
export type PublicationDecision =
  | { kind: 'conflict' | 'unchanged' | 'already_committed'; revision: number }
  | { kind: 'write'; revision: number; operationId: string; draft: CatalogueDraft; priceChangedIds: string[]; availabilityChangedIds: string[] };

function editableOffer(offer: Offer): EditableOffer {
  const { enabled, pricePaise, priceVisibility, availability, stockQuantity } = offer;
  return { enabled, pricePaise, priceVisibility, availability, stockQuantity };
}
export function editableDraft(catalogue: Catalogue): CatalogueDraft {
  return { acceptingRequests: catalogue.acceptingRequests, showPrices: catalogue.showPrices,
    offers: Object.fromEntries(Object.entries(catalogue.offers).map(([id, offer]) => [id, editableOffer(offer)])) };
}
function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
    Reflect.ownKeys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) {
    throw new Error('Invalid editable catalogue');
  }
  return value as Record<string, unknown>;
}
function validateDraft(raw: unknown, reference: Catalogue, products: readonly Product[]): Catalogue {
  const draft = exactRecord(raw, ['acceptingRequests', 'showPrices', 'offers']);
  const ids = products.map(product => product.id);
  const offers = exactRecord(draft.offers, ids);
  return parseCatalogue({ ...reference, acceptingRequests: draft.acceptingRequests, showPrices: draft.showPrices,
    offers: Object.fromEntries(ids.map(id => {
      const editable = exactRecord(offers[id], ['enabled', 'pricePaise', 'priceVisibility', 'availability', 'stockQuantity']);
      return [id, { ...editable, priceUpdatedAt: reference.offers[id].priceUpdatedAt, availabilityUpdatedAt: reference.offers[id].availabilityUpdatedAt }];
    })) }, products);
}
function changed(a: EditableOffer, b: EditableOffer): { price: boolean; availability: boolean } {
  return { price: a.pricePaise !== b.pricePaise || a.priceVisibility !== b.priceVisibility,
    availability: a.enabled !== b.enabled || a.availability !== b.availability || a.stockQuantity !== b.stockQuantity };
}
function differences(a: Catalogue, b: Catalogue, products: readonly Product[]) {
  const priceChangedIds: string[] = []; const availabilityChangedIds: string[] = [];
  for (const { id } of products) {
    const delta = changed(a.offers[id], b.offers[id]);
    if (delta.price) priceChangedIds.push(id);
    if (delta.availability) availabilityChangedIds.push(id);
  }
  const any = a.acceptingRequests !== b.acceptingRequests || a.showPrices !== b.showPrices || priceChangedIds.length > 0 || availabilityChangedIds.length > 0;
  return { any, priceChangedIds, availabilityChangedIds };
}

/** Pure transaction decision. Call only after authenticated membership and server reads.
 * The SDK adapter must set serverTimestamp() on the new revision and changed fields,
 * retain untouched timestamps, and atomically create its matching audit record.
 */
export function planPublication(current: Catalogue, intent: SaveIntent, actorUid: string, existingAudit: AuditRecord | null, products: readonly Product[]): PublicationDecision {
  if (!actorUid || typeof actorUid !== 'string' || !Number.isSafeInteger(intent.expectedRevision) || intent.expectedRevision < 1 || intent.expectedRevision >= Number.MAX_SAFE_INTEGER ||
    typeof intent.operationId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(intent.operationId)) throw new Error('Invalid publication intent');
  const base = parseCatalogue(current, products);
  if (existingAudit !== null) {
    exactRecord(existingAudit, ['actorUid', 'previousRevision', 'createdAt', 'snapshot']);
    const snapshot = parseCatalogue(existingAudit.snapshot, products);
    const attempted = validateDraft(intent.draft, snapshot, products);
    if (existingAudit.actorUid !== actorUid || existingAudit.previousRevision !== intent.expectedRevision ||
      existingAudit.createdAt !== snapshot.updatedAt || snapshot.operationId !== intent.operationId || snapshot.revision !== intent.expectedRevision + 1 ||
      base.revision < snapshot.revision || (base.revision === snapshot.revision && (base.operationId !== snapshot.operationId || base.updatedAt !== snapshot.updatedAt || differences(base, snapshot, products).any || products.some(({ id }) => base.offers[id].priceUpdatedAt !== snapshot.offers[id].priceUpdatedAt || base.offers[id].availabilityUpdatedAt !== snapshot.offers[id].availabilityUpdatedAt))) ||
      differences(snapshot, attempted, products).any) throw new Error('Operation ID conflict or inconsistent audit');
    return { kind: 'already_committed', revision: snapshot.revision };
  }
  if (base.operationId === intent.operationId) throw new Error('Missing audit for existing operation');
  if (base.revision !== intent.expectedRevision) return { kind: 'conflict', revision: base.revision };
  const candidate = validateDraft(intent.draft, base, products);
  const problems = publicationProblems(candidate, products);
  if (problems.length) throw new Error(`Catalogue not ready: ${problems.join('; ')}`);
  const { any, priceChangedIds, availabilityChangedIds } = differences(base, candidate, products);
  if (!any) return { kind: 'unchanged', revision: base.revision };
  return { kind: 'write', revision: base.revision + 1, operationId: intent.operationId, draft: editableDraft(candidate), priceChangedIds, availabilityChangedIds };
}
