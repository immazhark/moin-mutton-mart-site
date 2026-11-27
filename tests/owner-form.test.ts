import {describe, expect, it} from 'vitest';
import {products} from '../src/data/products';
import {parsePrice, parseStock, encodeBackup, decodeBackup, buildDraft, formFromCatalogue} from '../src/lib/catalogue/owner-form';
import {parseCatalogue} from '../src/lib/catalogue/contract';

const current = () => parseCatalogue({schemaVersion:1, revision:1, updatedAt:100, operationId:'bootstrap', acceptingRequests:true, showPrices:true, offers:Object.fromEntries(products.map(p=>[p.id,{enabled:true,pricePaise:100050,priceVisibility:'inherit',availability:'available',stockQuantity:null,priceUpdatedAt:100,availabilityUpdatedAt:100}]))},products);
describe('owner form and backup',()=>{
  it('converts decimal rupees without floating point rounding or permissive coercion',()=>{
    expect(parsePrice('1000.50')).toBe(100050);
    expect(parsePrice('0.01')).toBe(1);
    expect(parsePrice('')).toBeNull();
    for(const invalid of ['0','-1','1e3','1.001','1,000','1.','100000.01',' 12 ','NaN']) expect(()=>parsePrice(invalid)).toThrow();
  });
  it('distinguishes blank unknown stock from zero, accepts integer units only',()=>{
    expect(parseStock('')).toBeNull();
    expect(parseStock('0')).toBe(0);
    expect(parseStock('500')).toBe(500);
    for(const invalid of ['-1','1.5','1e3','1000000001',' ']) expect(()=>parseStock(invalid)).toThrow();
  });
  it('preserves saved rates even when display is disabled',()=>{
    const form=formFromCatalogue(current());
    form.showPrices=false;
    expect(buildDraft(form,products).offers.paya.pricePaise).toBe(100050);
    form.offers.paya.price='';
    expect(()=>buildDraft(form,products)).toThrow();
    form.offers.paya.priceVisibility='ask';
    expect(buildDraft(form,products).offers.paya.pricePaise).toBeNull();
  });
  it('round trips a private backup without operation IDs or timestamps',()=>{
    const draft=buildDraft(formFromCatalogue(current()),products);
    const encoded=encodeBackup(draft,products);
    expect(encoded).not.toContain('operationId');
    expect(encoded).not.toContain('actorUid');
    expect(decodeBackup(encoded,products)).toEqual(draft);
  });
  it('rejects oversized, malformed, injected and incomplete backups',()=>{
    const draft=buildDraft(formFromCatalogue(current()),products);
    const envelope=JSON.parse(encodeBackup(draft,products));
    for(const value of [{...envelope,uid:'private'},{...envelope,version:2},{...envelope,draft:{...draft,offers:{}}},{...envelope,draft:{...draft,offers:{...draft.offers,paya:{...draft.offers.paya,stockQuantity:-1}}}},{...envelope,draft:{...draft,offers:{...draft.offers,paya:{...draft.offers.paya,pricePaise:null}}}}]) expect(()=>decodeBackup(JSON.stringify(value),products)).toThrow();
    expect(()=>decodeBackup('x'.repeat(65537),products)).toThrow();
    expect(()=>decodeBackup('not json',products)).toThrow();
  });
});
