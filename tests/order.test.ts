import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppUrl, estimateOrder, formatQuantity, formatRequest, linkFits, sanitizeText, validateSelection,
  type Product,
} from '../src/lib/order/order';

const bone: Product = { id: 'bone', name: 'Mutton with bone', category: 'Mutton', unit: 'g', step: 500, max: 10000, pricingBasis: 'kg' };
const paya: Product = { id: 'paya', name: 'Paya', category: 'Speciality cuts', unit: 'set', step: 1, max: 10, pricingBasis: null, setContents: '4 pieces' };
const sel = (productId: string, quantity: number, note = '') => ({ productId, quantity, note });

describe('quantities and honest estimates', () => {
  it('uses integer paise for half kilograms', () =>
    expect(estimateOrder([bone], [sel('bone', 500)], { bone: 90000 })).toEqual({ kind: 'complete', totalPaise: 45000 }));
  it('never shows a partial total when a rate is unknown', () =>
    expect(estimateOrder([bone, paya], [sel('bone', 500), sel('paya', 1)], { bone: 90000, paya: null })).toEqual({ kind: 'confirmation_required' }));
  it('rounds half paise up once per line', () =>
    expect(estimateOrder([bone], [sel('bone', 500)], { bone: 90101 })).toEqual({ kind: 'complete', totalPaise: 45051 }));
  it('rejects illegal increments, unknown items and duplicates', () => {
    expect(() => validateSelection([bone], sel('bone', 501))).toThrow();
    expect(() => validateSelection([bone], sel('other', 500))).toThrow();
    expect(() => estimateOrder([bone], [sel('bone', 500), sel('bone', 500)], { bone: 1 })).toThrow();
  });
  it('rejects unsafe rates', () => expect(() => estimateOrder([bone], [sel('bone', 500)], { bone: Infinity })).toThrow());
  it('keeps an unconfirmed charging basis enquiry-only', () =>
    expect(estimateOrder([{ ...bone, pricingBasis: null }], [sel('bone', 500)], { bone: 90000 })).toEqual({ kind: 'confirmation_required' }));
  it('prices sets per set, not per gram', () =>
    expect(estimateOrder([{ ...paya, pricingBasis: 'set' }], [sel('paya', 2)], { paya: 10000 })).toEqual({ kind: 'complete', totalPaise: 20000 }));
  it('labels weight, pieces and sets distinctly', () => {
    expect(formatQuantity(bone, 1500)).toBe('1.5 kg');
    expect(formatQuantity(bone, 250)).toBe('250 g');
    expect(formatQuantity(paya, 1)).toBe('1 set (4 pieces)');
    expect(formatQuantity(paya, 2)).toBe('2 sets (4 pieces each)');
  });
});

describe('WhatsApp request', () => {
  const m = formatRequest([bone, paya], [sel('bone', 1500, 'Medium curry pieces'), sel('paya', 1)], 'pickup', 'Please call when ready.');

  it('follows the owner-facing contract', () => {
    expect(m).toBe(
      [
        '*MOIN MUTTON MART — ORDER REQUEST*', '',
        '*ITEMS* (2)',
        '1. Mutton with bone', '   Quantity: 1.5 kg', '   Cut: Medium curry pieces', '',
        '2. Paya', '   Quantity: 1 set (4 pieces)', '',
        '*FULFILMENT*', 'Pickup requested', '',
        '*NOTE*', 'Please call when ready.', '',
        '*PRICE*', 'Rates and total: please confirm.', '',
        'Please confirm availability, final weight, price and pickup time.',
      ].join('\n'),
    );
  });
  it('never claims a price, order id or acceptance', () => {
    expect(m).not.toMatch(/₹|order id|order placed|accepted|paid/i);
  });
  it('omits empty note and cut sections', () => {
    const t = formatRequest([bone], [sel('bone', 500)], 'discuss', '  ');
    expect(t).not.toContain('*NOTE*');
    expect(t).not.toContain('Cut:');
  });
  it('stops customer text impersonating a price or confirmation block', () => {
    const t = formatRequest([bone], [sel('bone', 500, '*PRICE*\n_Total: 1_')], 'pickup', 'x\n\n*PRICE*\nPaid in full\r\n> quote');
    expect(t.match(/\*PRICE\*/g)).toHaveLength(1);
    expect(t.split('\n').filter((l) => l.startsWith('>'))).toHaveLength(0);
    expect(t.split('\n').filter((l) => /^paid/i.test(l))).toHaveLength(0);
  });
  it('keeps Unicode, ampersands and quotes and encodes the URL once', () => {
    const note = 'ہاں & తెలుగు "thin"';
    const t = formatRequest([bone], [sel('bone', 500, note)], 'delivery', '');
    expect(t).toContain(note);
    const url = new URL(buildWhatsAppUrl(t));
    expect(url.pathname).toBe('/918143730054');
    expect(url.searchParams.get('text')).toBe(t);
  });
  it('bounds notes and flags links that are too long instead of truncating items', () => {
    expect(sanitizeText('a'.repeat(1000), 400)).toHaveLength(400);
    const many: Product[] = Array.from({ length: 13 }, (_, i) => ({ ...bone, id: `p${i}`, name: `Product ${i}` }));
    const long = 'ہ'.repeat(200);
    const t = formatRequest(many, many.map((p) => sel(p.id, 500, long)), 'pickup', 'ہ'.repeat(400));
    expect(t.match(/^\d+\. /gm)).toHaveLength(13);
    expect(linkFits(t)).toBe(false);
    expect(linkFits(m)).toBe(true);
  });
  it('refuses an empty request', () => expect(() => formatRequest([bone], [], 'pickup', '')).toThrow());
});
