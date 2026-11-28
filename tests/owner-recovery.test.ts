import {describe,it,expect} from 'vitest';
import {products} from '../src/data/products';
import {encodeRecovery,decodeRecovery,RECOVERY_TTL_MS,RECOVERY_KEY} from '../src/lib/catalogue/owner-recovery';
import {buildDraft,formFromCatalogue} from '../src/lib/catalogue/owner-form';
import {parseCatalogue} from '../src/lib/catalogue/contract';

const scope={projectId:'demo-moin-security',uid:'fixture-owner'};
const now=1000000;
const base=()=>parseCatalogue({schemaVersion:1,revision:2,updatedAt:100,operationId:'previous',acceptingRequests:true,showPrices:true,offers:Object.fromEntries(products.map(p=>[p.id,{enabled:true,pricePaise:100000,priceVisibility:'inherit',availability:'available',stockQuantity:null,priceUpdatedAt:100,availabilityUpdatedAt:100}]))},products);
const intent=()=>{const form=formFromCatalogue(base());form.offers['mutton-bone'].price='1200.50';return {expectedRevision:2,operationId:'same-op',draft:buildDraft(form,products)};};
describe('bounded, account-scoped owner save recovery',()=>{
  it('round-trips the exact operation and immutable draft without credentials',()=>{
    const data=intent();
    const raw=encodeRecovery(scope,data,products,now);
    expect(RECOVERY_KEY).toBe('moin-owner-pending-v1');
    expect(raw).not.toMatch(/email|password|accessToken|refreshToken/);
    expect(decodeRecovery(raw,scope,products,now+1000)).toEqual({createdAt:now,intent:data});
  });
  it('rejects another account, project, future time and expired records',()=>{
    const raw=encodeRecovery(scope,intent(),products,now);
    expect(decodeRecovery(raw,{...scope,uid:'other'},products,now)).toBeNull();
    expect(decodeRecovery(raw,{...scope,projectId:'other-project'},products,now)).toBeNull();
    expect(decodeRecovery(raw,scope,products,now-1)).toBeNull();
    expect(decodeRecovery(raw,scope,products,now+RECOVERY_TTL_MS+1)).toBeNull();
  });
  it('rejects injected fields, invalid revisions, operation IDs and invalid draft',()=>{
    const record=JSON.parse(encodeRecovery(scope,intent(),products,now));
    for(const value of [{...record,token:'fake'},{...record,version:2},{...record,intent:{...record.intent,expectedRevision:0}},{...record,intent:{...record.intent,expectedRevision:Number.MAX_SAFE_INTEGER}},{...record,intent:{...record.intent,operationId:'a/b'}},{...record,intent:{...record.intent,draft:{}}}]){
      expect(decodeRecovery(JSON.stringify(value),scope,products,now)).toBeNull();
    }
    expect(decodeRecovery('x'.repeat(65537),scope,products,now)).toBeNull();
    expect(()=>encodeRecovery(scope,{...intent(),operationId:'a/b'},products,now)).toThrow();
  });
});
