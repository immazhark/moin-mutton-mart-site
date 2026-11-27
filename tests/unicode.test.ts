import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl, formatRequest, linkFits, sanitizeText, type Product } from '../src/lib/order/order';

const product: Product = { id: 'bone', name: 'Mutton with bone', category: 'Mutton', unit: 'g', step: 500, max: 10000, pricingBasis: 'kg' };

describe('Unicode-safe request encoding', () => {
  it('does not split an emoji at the UTF-16 input limit', () => {
    const prefix = 'a'.repeat(199);
    expect(sanitizeText(prefix + '😀', 200)).toBe(prefix);
    expect(sanitizeText('a'.repeat(198) + '😀', 200)).toBe('a'.repeat(198) + '😀');
  });
  it('repairs unpaired surrogates without throwing in the link guard', () => {
    const message = 'a\uD800b\uDC00c';
    expect(new URL(buildWhatsAppUrl(message)).searchParams.get('text')).toBe('a�b�c');
    expect(linkFits(message)).toBe(true);
    expect(sanitizeText(message, 200)).toBe('a�b�c');
  });
  it('preserves Urdu, Telugu, emoji joiners and ordinary punctuation', () => {
    const note = 'ہاں & తెలుగు 👨‍👩‍👧 "thin"';
    expect(sanitizeText(note, 200)).toBe(note);
    expect(sanitizeText('a\n\nb', 200)).toBe('a b');
  });
  it('retains all 13 lines even when the URL is too long', () => {
    const products = Array.from({ length: 13 }, (_, i) => ({ ...product, id: `p${i}` }));
    const items = products.map(p => ({ productId: p.id, quantity: 500, note: '😀'.repeat(99) + '\uD800' }));
    const message = formatRequest(products, items, 'pickup', 'ہ'.repeat(400));
    expect(message.match(/^\d+\. /gm)).toHaveLength(13);
    expect(linkFits(message)).toBe(false);
    expect(new URL(buildWhatsAppUrl(message)).searchParams.get('text')).toBe(message);
  });
});
