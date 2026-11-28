export type Unit = 'g' | 'piece' | 'set';
export type Fulfilment = 'pickup' | 'delivery' | 'discuss';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: Unit;
  /** Smallest request and the increment, in grams for weighted goods. */
  step: number;
  max: number;
  /** Null until the shop confirms how the product is charged. */
  pricingBasis: 'kg' | 'piece' | 'set' | null;
  /** What a "set" contains, only when the shop has said so. */
  setContents?: string;
  /** Owner-approved cut choices. Absent means free text only. */
  cuts?: readonly string[];
}

/** `note` carries the customer's cut / preparation preference for the line. */
export interface Selection {
  productId: string;
  quantity: number;
  note: string;
}

export const SHOP_WHATSAPP = '918143730054';
export const MAX_LINE_NOTE = 200;
export const MAX_ORDER_NOTE = 400;
/** Conservative ceiling for the encoded wa.me URL; beyond it we offer copy/call instead. */
export const MAX_LINK_LENGTH = 2000;

export function validateSelection(products: readonly Product[], s: Selection): Product {
  const p = products.find((x) => x.id === s.productId);
  if (
    !p ||
    !Number.isSafeInteger(s.quantity) ||
    s.quantity < p.step ||
    s.quantity > p.max ||
    s.quantity % p.step !== 0 ||
    typeof s.note !== 'string' ||
    s.note.length > MAX_LINE_NOTE
  ) {
    throw new Error('Invalid selection');
  }
  return p;
}

export type Estimate = { kind: 'complete'; totalPaise: number } | { kind: 'confirmation_required' };

/** Rates are integer paise per pricing basis (kg / piece / set). Rounds once per line. */
export function estimateOrder(
  products: readonly Product[],
  selections: Selection[],
  rates: Record<string, number | null>,
): Estimate {
  let total = 0;
  let unknown = false;
  const seen = new Set<string>();
  for (const s of selections) {
    const p = validateSelection(products, s);
    if (seen.has(p.id)) throw new Error('Duplicate selection');
    seen.add(p.id);
    const rate = rates[p.id];
    if (rate == null || p.pricingBasis === null) {
      unknown = true;
      continue;
    }
    if (!Number.isSafeInteger(rate) || rate <= 0 || rate > 10_000_000) throw new Error('Invalid rate');
    const quantityBasis = p.unit === 'g' ? 'kg' : p.unit;
    if (p.pricingBasis !== quantityBasis) {
      // E.g. two chickens are not two grams: only the shop can confirm actual weight.
      unknown = true;
      continue;
    }
    const numerator = rate * s.quantity;
    if (!Number.isSafeInteger(numerator)) throw new Error('Unsafe total');
    const perKg = p.pricingBasis === 'kg';
    // Avoid overflow from adding 500 to a near-limit integer numerator.
    total += perKg ? Math.floor(numerator / 1000) + (numerator % 1000 >= 500 ? 1 : 0) : numerator;
    if (!Number.isSafeInteger(total)) throw new Error('Unsafe total');
  }
  return unknown ? { kind: 'confirmation_required' } : { kind: 'complete', totalPaise: total };
}

/** "1.5 kg", "250 g", "2 pieces", "1 set (4 pieces)". Never mixes units. */
export function formatQuantity(p: Product, q: number): string {
  if (p.unit === 'g') return q >= 1000 ? `${q / 1000} kg` : `${q} g`;
  const label = `${q} ${p.unit}${q === 1 ? '' : 's'}`;
  if (p.unit !== 'set' || !p.setContents) return label;
  return `${label} (${p.setContents}${q === 1 ? '' : ' each'})`;
}

/** A Unicode-aware regexp matches only unpaired surrogates, not valid pairs. */
function wellFormed(text: string): string {
  return text.replace(/[\uD800-\uDFFF]/gu, '\uFFFD');
}

/**
 * Customer text becomes a single plain line: control characters and newlines collapse to
 * spaces and WhatsApp formatting delimiters are dropped, so a note cannot fake a header,
 * price or confirmation block. Unicode is kept.
 */
export function sanitizeText(text: string, max: number): string {
  return wellFormed(text)
    // Keep ZWJ and ZWNJ, which carry meaning in multilingual text and emoji.
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, (c) => c === '\u200C' || c === '\u200D' ? c : ' ')
    .replace(/[*_~`]/g, '')
    .replace(/^>+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    // HTML input limits are UTF-16 units; discard a truncated trailing half-pair.
    .replace(/[\uD800-\uDBFF]$/u, '')
    .trim();
}

const FULFILMENT_LINE: Record<Fulfilment, string> = {
  pickup: 'Pickup chahiye.',
  delivery: 'Delivery chahiye; charges aur time confirm kar dijiye.',
  discuss: 'Pickup ya delivery ke liye baat karni hai.',
};

export function formatRequest(
  products: readonly Product[],
  selections: Selection[],
  fulfilment: Fulfilment,
  orderNote: string,
  estimate?: Estimate,
): string {
  if (!selections.length) throw new Error('Empty request');
  const items = selections.map((s, i) => {
    const p = validateSelection(products, s);
    const cut = sanitizeText(s.note, MAX_LINE_NOTE);
    return [`${i + 1}. ${p.name}`, `   Quantity: ${formatQuantity(p, s.quantity)}`, ...(cut ? [`   Cut: ${cut}`] : [])].join('\n');
  });
  const note = sanitizeText(orderNote, MAX_ORDER_NOTE);
  return [
    '*MOIN MUTTON MART — ORDER REQUEST*',
    `*ITEMS* (${selections.length})\n${items.join('\n\n')}`,
    `*FULFILMENT*\n${FULFILMENT_LINE[fulfilment]}`,
    ...(note ? [`*NOTE*\n${note}`] : []),
    estimate?.kind === 'complete'
      ? '*PRICE*\nAndaza: '+new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(estimate.totalPaise/100)+'. Final rate aur total confirm kar dijiye.'
      : '*PRICE*\nRate aur total confirm kar dijiye.',
    'Availability, final weight, total aur timing confirm kar dijiye.',
  ].join('\n\n');
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(wellFormed(message))}`;
}

/** False means the link is too long to trust; the UI then offers copy and call only. */
export function linkFits(message: string): boolean {
  return buildWhatsAppUrl(message).length <= MAX_LINK_LENGTH;
}
