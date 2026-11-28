import {describe,expect,it} from 'vitest';
import {products} from '../src/data/products';
import {parseCatalogue} from '../src/lib/catalogue/contract';
import {CatalogueSession,reviewChanges,requestEstimate} from '../src/lib/catalogue/freshness';
import type {Product,Selection} from '../src/lib/order/order';
const approved:Product[]=products.map(p=>({...p,pricingBasis:p.unit==='g'?'kg':p.unit}));
const fixture=()=>parseCatalogue({schemaVersion:1,revision:1,updatedAt:100,operationId:'first',acceptingRequests:true,showPrices:true,offers:Object.fromEntries(products.map(p=>[p.id,{enabled:true,pricePaise:100000,priceVisibility:'inherit',availability:'available',stockQuantity:null,priceUpdatedAt:100,availabilityUpdatedAt:100}]))},approved);
const items:Selection[]=[{productId:'mutton-bone',quantity:500,note:''}];
function deferred<T>(){let resolve!:(v:T)=>void,reject!:(e:Error)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
describe('live catalogue freshness',()=>{
 it('deduplicates reads and measures freshness at completion, not publication time',async()=>{
   let now=0,calls=0;const gate=deferred<ReturnType<typeof fixture>>();
   const session=new CatalogueSession(()=>{calls++;return gate.promise;},()=>now);
   const first=session.refresh(),second=session.refresh();
   expect(first).toBe(second);expect(calls).toBe(1);
   now=5000;gate.resolve(fixture());await first;
   expect(session.getSnapshot()).toMatchObject({kind:'ready',fetchedAt:5000});
   now=64999;expect(session.needsRefresh()).toBe(false);
   now=65000;expect(session.needsRefresh()).toBe(true);
 });
 it('removes authoritative cached values after a failed server refresh and allows retry',async()=>{
   let fail=false;const session=new CatalogueSession(async()=>{if(fail)throw Error('offline');return fixture();});
   await session.refresh();fail=true;await session.refresh();
   expect(session.getSnapshot()).toEqual({kind:'unavailable'});
   fail=false;await session.refresh();expect(session.getSnapshot().kind).toBe('ready');
 });
 it('requires review for selected changes, ignores unrelated changes',()=>{
   const previous=fixture(),next=fixture();
   next.revision=2;next.offers.paya.pricePaise=110000;
   expect(reviewChanges(previous,next,approved,items)).toEqual({kind:'ready',changes:[]});
   next.offers['mutton-bone'].pricePaise=110000;
   expect(reviewChanges(previous,next,approved,items)).toEqual({kind:'review',changes:['mutton-bone']});
   expect(reviewChanges(null,next,approved,items)).toEqual({kind:'review',changes:['mutton-bone']});
 });
 it('blocks closed, sold-out, disabled and insufficient-stock selections',()=>{
   const old=fixture();
   for(const patch of [{enabled:false},{availability:'sold_out' as const},{stockQuantity:499}]){
     const next=fixture();Object.assign(next.offers['mutton-bone'],patch);
     expect(reviewChanges(old,next,approved,items).kind).toBe('blocked');
   }
   expect(reviewChanges(old,{...old,acceptingRequests:false},approved,items).kind).toBe('blocked');
 });
 it('does not use hidden rates or unconfirmed charging units for an estimate',()=>{
   const current=fixture();
   expect(requestEstimate(current,approved,items)).toEqual({kind:'complete',totalPaise:50000});
   expect(requestEstimate({...current,showPrices:false},approved,items)).toEqual({kind:'confirmation_required'});
   expect(requestEstimate(current,products,items)).toEqual({kind:'confirmation_required'});
   expect(requestEstimate(null,approved,items)).toEqual({kind:'confirmation_required'});
   current.offers['mutton-bone'].stockQuantity=0;
   expect(requestEstimate(current,approved,items)).toEqual({kind:'confirmation_required'});
 });
 it('does not leak a hidden saved rate through a change notification',()=>{
   const previous={...fixture(),showPrices:false},next={...fixture(),showPrices:false};
   next.offers['mutton-bone'].pricePaise=120000;
   expect(reviewChanges(previous,next,approved,items)).toEqual({kind:'ready',changes:[]});
 });
});

describe('known availability survives failed refresh without stale pricing',()=>{
  it('retains last-known negative constraints during loading and outage, but never offers stale estimates',async()=>{
    const closed=fixture();closed.acceptingRequests=false;
    const gate=deferred<ReturnType<typeof fixture>>();let call=0;
    const session=new CatalogueSession(()=>++call===1?Promise.resolve(closed):gate.promise);
    await session.refresh();
    expect(session.getLastKnownCatalogue()?.acceptingRequests).toBe(false);
    const refresh=session.refresh();
    expect(session.getSnapshot()).toEqual({kind:'loading'});
    expect(session.getLastKnownCatalogue()?.acceptingRequests).toBe(false);
    gate.reject(Error('offline'));await refresh;
    expect(session.getSnapshot()).toEqual({kind:'unavailable'});
    expect(reviewChanges(null,session.getLastKnownCatalogue()!,approved,items).kind).toBe('blocked');
    expect(requestEstimate(null,approved,items)).toEqual({kind:'confirmation_required'});
  });
  it('clears a known blocked selection only after a successful new read',async()=>{
    const soldOut=fixture();soldOut.offers['mutton-bone'].availability='sold_out';
    const open=fixture();open.revision=2;let call=0;
    const session=new CatalogueSession(async()=>{call++;if(call===2)throw Error('offline');return call===1?soldOut:open;});
    expect(session.getLastKnownCatalogue()).toBeNull();
    await session.refresh();await session.refresh();
    expect(reviewChanges(null,session.getLastKnownCatalogue()!,approved,items).kind).toBe('blocked');
    await session.refresh();
    expect(session.getLastKnownCatalogue()?.revision).toBe(2);
    expect(reviewChanges(null,session.getLastKnownCatalogue()!,approved,items).kind).toBe('review');
  });
});
