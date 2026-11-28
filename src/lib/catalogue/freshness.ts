import {assessQuantity,displayedRate,type Catalogue} from './contract';
import {estimateOrder,type Estimate,type Product,type Selection} from '../order/order';

export const FRESH_FOR_MS=60_000;
export type CatalogueSnapshot={kind:'loading'}|{kind:'unavailable'}|{kind:'ready';catalogue:Catalogue;fetchedAt:number};
/** One read per in-flight request, no polling, no authoritative stale fallback. */
export class CatalogueSession {
  private snapshot:CatalogueSnapshot={kind:'loading'};
  // Retain only for conservative blocking, never as authoritative prices or available stock.
  private lastKnown:Catalogue|null=null;
  private inflight:Promise<CatalogueSnapshot>|null=null;
  private listeners=new Set<()=>void>();
  constructor(private readonly read:()=>Promise<Catalogue>,private readonly now:()=>number=()=>Date.now()){}
  getSnapshot=()=>this.snapshot;
  getLastKnownCatalogue=()=>this.lastKnown;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private publish(value:CatalogueSnapshot){
    if(value.kind==='ready')this.lastKnown=value.catalogue;
    this.snapshot=value;for(const listener of this.listeners)listener();
  }
  needsRefresh():boolean{
    if(this.snapshot.kind!=='ready')return true;
    const elapsed=this.now()-this.snapshot.fetchedAt;
    return elapsed<0||elapsed>=FRESH_FOR_MS;
  }
  refresh():Promise<CatalogueSnapshot>{
    if(this.inflight)return this.inflight;
    // Call read synchronously, but convert sync throws into rejected promises.
    let operation:Promise<Catalogue>;
    try{operation=this.read();}catch(error){operation=Promise.reject(error);}
    const task=operation.then(
      (catalogue):CatalogueSnapshot=>({kind:'ready',catalogue,fetchedAt:this.now()}),
      ():CatalogueSnapshot=>({kind:'unavailable'}),
    ).then(snapshot=>{this.publish(snapshot);return snapshot;}).finally(()=>{this.inflight=null;});
    this.inflight=task;
    this.publish({kind:'loading'});
    return task;
  }
}
export type ReviewDecision={kind:'ready'|'review';changes:string[]}|{kind:'blocked';blocked:{id:string;reason:string}[]};
function signature(catalogue:Catalogue,product:Product):string{
  const o=catalogue.offers[product.id];
  const rate=product.pricingBasis?displayedRate(catalogue,product.id):{kind:'unconfirmed'};
  return JSON.stringify([o.enabled,o.availability,o.stockQuantity,rate]);
}
export function reviewChanges(previous:Catalogue|null,next:Catalogue,products:readonly Product[],items:readonly Selection[]):ReviewDecision{
  const indexed=new Map(products.map(p=>[p.id,p]));
  const blocked:{id:string;reason:string}[]=[],changes:string[]=[];
  for(const selection of items){
    const p=indexed.get(selection.productId);
    if(!p){blocked.push({id:selection.productId,reason:'invalid_quantity'});continue;}
    const assessment=assessQuantity(next,p,selection.quantity);
    if(assessment.kind==='blocked'){blocked.push({id:p.id,reason:assessment.reason});continue;}
    if(previous===null||signature(previous,p)!==signature(next,p))changes.push(p.id);
  }
  if(blocked.length)return {kind:'blocked',blocked};
  return {kind:changes.length?'review':'ready',changes};
}
/** A total is shown only when every selected item has a visible, usable rate. */
export function requestEstimate(catalogue:Catalogue|null,products:readonly Product[],items:Selection[]):Estimate{
  if(!catalogue||!items.length)return {kind:'confirmation_required'};
  const indexed=new Map(products.map(p=>[p.id,p]));
  const rates:Record<string,number|null>=Object.create(null);
  for(const item of items){
    const p=indexed.get(item.productId);
    if(!p||assessQuantity(catalogue,p,item.quantity).kind==='blocked')return {kind:'confirmation_required'};
    const rate=displayedRate(catalogue,p.id);
    rates[p.id]=rate.kind==='visible'?rate.pricePaise:null;
  }
  return estimateOrder(products,items,rates);
}
