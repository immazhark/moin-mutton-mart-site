import {describe,it,expect} from 'vitest';
import {estimateOrder,formatQuantity,formatRequest,buildWhatsAppUrl,validateSelection} from '../src/lib/order/order';
const p={id:'bone',name:'Mutton with bone',category:'Mutton',unit:'g',step:500,max:10000,pricingBasis:'kg'} as const;
describe('quantities and honest estimates',()=>{
 it('calculates half kilograms using integer paise',()=>expect(estimateOrder([p],[{productId:'bone',quantity:500,note:''}],{bone:90000})).toEqual({kind:'complete',totalPaise:45000}));
 it('never presents a partial total for unknown rates',()=>expect(estimateOrder([p],[{productId:'bone',quantity:500,note:''}],{bone:null})).toEqual({kind:'confirmation_required'}));
 it('rounds half paise upwards once per line',()=>expect(estimateOrder([p],[{productId:'bone',quantity:500,note:''}],{bone:90101})).toEqual({kind:'complete',totalPaise:45051}));
 it('rejects illegal increments and unknown items',()=>{expect(()=>validateSelection([p],{productId:'bone',quantity:501,note:''})).toThrow();expect(()=>validateSelection([p],{productId:'other',quantity:500,note:''})).toThrow()});
 it('rejects unsafe prices',()=>expect(()=>estimateOrder([p],[{productId:'bone',quantity:500,note:''}],{bone:Infinity})).toThrow());
 it('keeps unconfirmed pricing bases enquiry-only',()=>expect(estimateOrder([{...p,pricingBasis:null}],[{productId:'bone',quantity:500,note:''}],{bone:90000})).toEqual({kind:'confirmation_required'}));
 it('calculates sets without treating them as grams',()=>expect(estimateOrder([{...p,unit:'set',step:1,max:10,pricingBasis:'set'}],[{productId:'bone',quantity:2,note:''}],{bone:10000})).toEqual({kind:'complete',totalPaise:20000}));
 it('labels the selected weight',()=>expect(formatQuantity(p,1500)).toBe('1.5 kg'));
});
describe('WhatsApp request',()=>{
 it('keeps preferences and states confirmation is required',()=>{const m=formatRequest([p],[{productId:'bone',quantity:500,note:'Medium curry pieces & ہاں'}],'Pickup','Please call');expect(m).toContain('500 g');expect(m).toContain('Medium curry pieces & ہاں');expect(m).toContain('Please confirm');expect(m).not.toContain('₹0');expect(new URL(buildWhatsAppUrl(m)).searchParams.get('text')).toBe(m)});
});
