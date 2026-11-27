import type { Product } from '../order/order';

export const MAX_RATE_PAISE = 10_000_000;
// A technical storage safety ceiling, not an owner-approved sales or stock limit.
export const MAX_STOCK_QUANTITY = 1_000_000_000;
export type PriceVisibility = 'inherit' | 'show' | 'ask';
export type Availability = 'available' | 'sold_out' | 'ask';
export interface Offer {
  enabled: boolean;
  pricePaise: number | null;
  priceVisibility: PriceVisibility;
  availability: Availability;
  /** Integer grams, pieces or sets, in the corresponding product's request unit. */
  stockQuantity: number | null;
  priceUpdatedAt: number;
  availabilityUpdatedAt: number;
}
export interface Catalogue {
  schemaVersion: 1;
  revision: number;
  /** Normalized UTC epoch milliseconds; Firestore adapter must validate timestamps. */
  updatedAt: number;
  operationId: string;
  acceptingRequests: boolean;
  showPrices: boolean;
  offers: Record<string, Offer>;
}

function invalid(field: string): never { throw new Error(`Invalid catalogue: ${field}`); }
function exactRecord(value: unknown, keys: readonly string[], field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return invalid(field);
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return invalid(field);
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || !keys.every((key) => Object.hasOwn(value, key))) return invalid(field);
  return value as Record<string, unknown>;
}
function integer(value: unknown, min: number, max: number, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) return invalid(field);
  return value;
}
function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') return invalid(field);
  return value;
}
function nullableInteger(value: unknown, min: number, max: number, field: string): number | null {
  return value === null ? null : integer(value, min, max, field);
}
function visibility(value: unknown): PriceVisibility {
  if (value === 'inherit' || value === 'show' || value === 'ask') return value;
  return invalid('priceVisibility');
}
function availability(value: unknown): Availability {
  if (value === 'available' || value === 'sold_out' || value === 'ask') return value;
  return invalid('availability');
}

/** Strict parser for normalized data. This is not a substitute for Firestore Rules. */
export function parseCatalogue(value: unknown, products: readonly Product[]): Catalogue {
  const keys = products.map((product) => product.id);
  if (!keys.length || new Set(keys).size !== keys.length || keys.some((id) => !/^[a-z0-9-]+$/.test(id))) return invalid('product metadata');
  const raw = exactRecord(value, ['schemaVersion', 'revision', 'updatedAt', 'operationId', 'acceptingRequests', 'showPrices', 'offers'], 'document');
  if (raw.schemaVersion !== 1) return invalid('schemaVersion');
  const revision = integer(raw.revision, 1, Number.MAX_SAFE_INTEGER, 'revision');
  const updatedAt = integer(raw.updatedAt, 0, 8_640_000_000_000_000, 'updatedAt');
  if (typeof raw.operationId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(raw.operationId)) return invalid('operationId');
  const offersRaw = exactRecord(raw.offers, keys, 'offers');
  const offers = Object.fromEntries(keys.map((id): [string, Offer] => {
    const offer = exactRecord(offersRaw[id], ['enabled', 'pricePaise', 'priceVisibility', 'availability', 'stockQuantity', 'priceUpdatedAt', 'availabilityUpdatedAt'], `offer ${id}`);
    return [id, {
      enabled: boolean(offer.enabled, 'enabled'),
      pricePaise: nullableInteger(offer.pricePaise, 1, MAX_RATE_PAISE, 'pricePaise'),
      priceVisibility: visibility(offer.priceVisibility),
      availability: availability(offer.availability),
      stockQuantity: nullableInteger(offer.stockQuantity, 0, MAX_STOCK_QUANTITY, 'stockQuantity'),
      priceUpdatedAt: integer(offer.priceUpdatedAt, 0, updatedAt, 'priceUpdatedAt'),
      availabilityUpdatedAt: integer(offer.availabilityUpdatedAt, 0, updatedAt, 'availabilityUpdatedAt'),
    }];
  }));
  return { schemaVersion: 1, revision, updatedAt, operationId: raw.operationId, acceptingRequests: boolean(raw.acceptingRequests, 'acceptingRequests'), showPrices: boolean(raw.showPrices, 'showPrices'), offers };
}

export type DisplayedRate = { kind: 'missing' } | { kind: 'ask' } | { kind: 'visible'; pricePaise: number };
export function displayedRate(catalogue: Catalogue, id: string): DisplayedRate {
  const offer = Object.hasOwn(catalogue.offers, id) ? catalogue.offers[id] : undefined;
  if (!offer) return { kind: 'missing' };
  // Hiding rates is presentation, not confidentiality: public document readers can see saved rates.
  if (offer.priceVisibility === 'ask') return { kind: 'ask' };
  if (offer.pricePaise === null) return { kind: 'missing' };
  if (offer.priceVisibility === 'inherit' && !catalogue.showPrices) return { kind: 'ask' };
  return { kind: 'visible', pricePaise: offer.pricePaise };
}

/** Structural validity and publication readiness are distinct. Never manufacture missing rates. */
export function publicationProblems(catalogue: Catalogue, products: readonly Product[]): string[] {
  const problems: string[] = [];
  for (const product of products) {
    if (!product.pricingBasis) problems.push(`${product.id}: charging basis unconfirmed`);
    if (displayedRate(catalogue, product.id).kind === 'missing') problems.push(`${product.id}: rate missing`);
  }
  return problems;
}

export type QuantityAssessment = { kind: 'requestable'; confirmationRequired: boolean } | { kind: 'blocked'; reason: 'invalid_quantity' | 'closed' | 'disabled' | 'sold_out' | 'insufficient_stock' };
export function assessQuantity(catalogue: Catalogue, product: Product, quantity: number): QuantityAssessment {
  if (!Number.isSafeInteger(quantity) || quantity < product.step || quantity > product.max || quantity % product.step !== 0) return { kind: 'blocked', reason: 'invalid_quantity' };
  if (!catalogue.acceptingRequests) return { kind: 'blocked', reason: 'closed' };
  const offer = Object.hasOwn(catalogue.offers, product.id) ? catalogue.offers[product.id] : undefined;
  if (!offer?.enabled) return { kind: 'blocked', reason: 'disabled' };
  if (offer.availability === 'sold_out') return { kind: 'blocked', reason: 'sold_out' };
  if (offer.stockQuantity !== null && quantity > offer.stockQuantity) return { kind: 'blocked', reason: 'insufficient_stock' };
  return { kind: 'requestable', confirmationRequired: offer.stockQuantity === null || offer.availability === 'ask' };
}
