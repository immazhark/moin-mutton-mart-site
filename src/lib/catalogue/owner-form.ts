import {MAX_RATE_PAISE, MAX_STOCK_QUANTITY, parseCatalogue, type Catalogue, type Availability, type PriceVisibility} from './contract';
import {editableDraft, type CatalogueDraft, type EditableOffer} from './publication';
import type {Product} from '../order/order';

export const MAX_BACKUP_BYTES = 65536;
export type OfferForm = Omit<EditableOffer, 'pricePaise' | 'stockQuantity'> & {price: string; stock: string};
export interface OwnerForm {acceptingRequests:boolean; showPrices:boolean; offers:Record<string,OfferForm>}
export function parsePrice(value:string):number|null {
  if (value==='') return null;
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) throw Error('Enter a positive rate in rupees with up to two decimal places.');
  const [whole,fraction='']=value.split('.');
  const paise=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if (paise<1||paise>MAX_RATE_PAISE) throw Error('Rate is outside the supported range.');
  return paise;
}
export function parseStock(value:string):number|null {
  if (value==='') return null;
  if (!/^\d{1,10}$/.test(value)) throw Error('Enter a whole nonnegative stock quantity or leave blank.');
  const count=Number(value);
  if (count>MAX_STOCK_QUANTITY) throw Error('Stock is outside the supported range.');
  return count;
}
export function formFromDraft(draft:CatalogueDraft):OwnerForm {
  return {acceptingRequests:draft.acceptingRequests,showPrices:draft.showPrices,offers:Object.fromEntries(Object.entries(draft.offers).map(([id,o])=>[id,{
    enabled:o.enabled,priceVisibility:o.priceVisibility,availability:o.availability,
    price:o.pricePaise===null?'':(o.pricePaise/100).toFixed(2),stock:o.stockQuantity===null?'':String(o.stockQuantity),
  }]))};
}
export function formFromCatalogue(catalogue:Catalogue):OwnerForm {return formFromDraft(editableDraft(catalogue));}
function exact(value:unknown,keys:readonly string[]):Record<string,unknown> {
  if(typeof value!=='object'||value===null||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||
    Reflect.ownKeys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))) throw Error('Invalid backup or catalogue fields.');
  return value as Record<string,unknown>;
}
function validatedDraft(value:unknown,products:readonly Product[]):CatalogueDraft {
  const raw=exact(value,['acceptingRequests','showPrices','offers']);
  const offers=exact(raw.offers,products.map(p=>p.id));
  const normalized=Object.fromEntries(products.map(p=>{
    const o=exact(offers[p.id],['enabled','pricePaise','priceVisibility','availability','stockQuantity']);
    if(o.pricePaise===null&&o.priceVisibility!=='ask') throw Error(p.name+': enter a rate or explicitly select Ask for rate.');
    return [p.id,{...o,priceUpdatedAt:0,availabilityUpdatedAt:0}];
  }));
  return editableDraft(parseCatalogue({schemaVersion:1,revision:1,updatedAt:0,operationId:'local-validation',acceptingRequests:raw.acceptingRequests,showPrices:raw.showPrices,offers:normalized},products));
}
export function buildDraft(form:OwnerForm,products:readonly Product[]):CatalogueDraft {
  exact(form,['acceptingRequests','showPrices','offers']);
  exact(form.offers,products.map(p=>p.id));
  const offers=Object.fromEntries(products.map(p=>{
    const o=form.offers[p.id];
    try {
      exact(o,['enabled','priceVisibility','availability','price','stock']);
      return [p.id,{enabled:o.enabled,priceVisibility:o.priceVisibility,availability:o.availability,pricePaise:parsePrice(o.price),stockQuantity:parseStock(o.stock)}];
    } catch(e) {throw Error(p.name+': '+(e instanceof Error?e.message:'Invalid entry'));}
  }));
  return validatedDraft({acceptingRequests:form.acceptingRequests,showPrices:form.showPrices,offers},products);
}
export function encodeBackup(draft:CatalogueDraft,products:readonly Product[]):string {
  return JSON.stringify({format:'moin-catalogue-backup',version:1,draft:validatedDraft(draft,products)},null,2);
}
export function decodeBackup(text:string,products:readonly Product[]):CatalogueDraft {
  if(new TextEncoder().encode(text).length>MAX_BACKUP_BYTES) throw Error('Backup file is too large.');
  let parsed:unknown;
  try{parsed=JSON.parse(text);}catch{throw Error('Backup is not valid JSON.');}
  const raw=exact(parsed,['format','version','draft']);
  if(raw.format!=='moin-catalogue-backup'||raw.version!==1) throw Error('Unsupported backup format.');
  return validatedDraft(raw.draft,products);
}
export const visibilityOptions:readonly [PriceVisibility,string][]=[['inherit','Use shop setting'],['show','Show rate'],['ask','Ask for rate']];
export const availabilityOptions:readonly [Availability,string][]=[['available','Available'],['sold_out','Sold out'],['ask','Confirm with shop']];
