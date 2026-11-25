export interface Product { id:string; name:string; category:string; unit:'g'|'piece'|'set'; step:number; max:number; pricingBasis:'kg'|'piece'|'set'|null }
export interface Selection { productId:string; quantity:number; note:string }
export function validateSelection(products:readonly Product[],s:Selection):Product {
 const p=products.find(p=>p.id===s.productId);
 if(!p||!Number.isSafeInteger(s.quantity)||s.quantity<p.step||s.quantity>p.max||s.quantity%p.step!==0||typeof s.note!=='string'||s.note.length>200) throw new Error('Invalid selection');
 return p;
}
export function estimateOrder(products:readonly Product[],selections:Selection[],rates:Record<string,number|null>):{kind:'complete';totalPaise:number}|{kind:'confirmation_required'} {
 let total=0,unknown=false;const ids=new Set<string>();
 for(const s of selections){const p=validateSelection(products,s);if(ids.has(p.id))throw new Error('Duplicate selection');ids.add(p.id);const rate=rates[p.id];
 if(rate==null||p.pricingBasis===null){unknown=true;continue;}
 if(!Number.isSafeInteger(rate)||rate<=0||rate>10000000)throw new Error('Invalid rate');
 const numerator=rate*s.quantity;if(!Number.isSafeInteger(numerator))throw new Error('Unsafe total');
 total+=Math.floor((numerator+(p.pricingBasis==='kg'?500:0))/(p.pricingBasis==='kg'?1000:1));if(!Number.isSafeInteger(total))throw new Error('Unsafe total');}
 return unknown?{kind:'confirmation_required'}:{kind:'complete',totalPaise:total};
}
export function formatQuantity(p:Product,q:number):string {return p.unit==='g'?(q>=1000?`${q/1000} kg`:`${q} g`):`${q} ${p.unit}${q===1?'':'s'}`;}
export function formatRequest(products:readonly Product[],selections:Selection[],fulfilment:string,note:string):string {
 if(!selections.length)throw new Error('Empty request');
 return ['Hello Moin Mutton Mart, I would like to enquire about:',...selections.map(s=>{const p=validateSelection(products,s);return `• ${p.name} — requested ${formatQuantity(p,s.quantity)}${s.note.trim()?` (${s.note.trim()})`:''}`;}),`Preference: ${fulfilment}`,note.trim()?`Order note: ${note.trim().slice(0,400)}`:'','Please confirm today’s rates, availability, charging weight, final total and pickup/delivery arrangements. This is an unpriced request, not a confirmed order.'].filter(Boolean).join('\n');
}
export function buildWhatsAppUrl(message:string):string {return `https://wa.me/918143730054?text=${encodeURIComponent(message)}`;}
