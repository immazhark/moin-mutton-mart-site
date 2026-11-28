import {describe,expect,it,vi} from 'vitest';
import {products} from '../src/data/products';
import {decodePublicDocument,readPublicDocument} from '../src/lib/catalogue/public-read';
const project='demo-moin-security';
const name='projects/'+project+'/databases/(default)/documents/public/catalogue';
const time='2026-11-28T06:00:00.123456789Z';
const ts=(s=time)=>({timestampValue:s});
const offer=()=>({mapValue:{fields:{
  enabled:{booleanValue:true},pricePaise:{integerValue:'100000'},priceVisibility:{stringValue:'inherit'},
  availability:{stringValue:'available'},stockQuantity:{nullValue:null},priceUpdatedAt:ts(),availabilityUpdatedAt:ts()
}}});
const fixture=()=>({name,fields:{
  schemaVersion:{integerValue:'1'},revision:{integerValue:'2'},updatedAt:ts(),operationId:{stringValue:'fixture'},
  acceptingRequests:{booleanValue:true},showPrices:{booleanValue:true},
  offers:{mapValue:{fields:Object.fromEntries(products.map(p=>[p.id,offer()]))}}
}});
describe('public REST catalogue boundary',()=>{
  it('decodes exact Firestore types and matches normalized catalogue',()=>{
    const result=decodePublicDocument(fixture(),project,products);
    expect(result.revision).toBe(2);
    expect(result.updatedAt).toBe(Date.parse(time));
    expect(Object.keys(result.offers)).toHaveLength(13);
    expect(result.offers['mutton-bone'].stockQuantity).toBeNull();
    expect(result.offers['mutton-bone'].pricePaise).toBe(100000);
  });
  it('rejects wrong document, extra fields, unsafe integers and wrong wire types',()=>{
    expect(()=>decodePublicDocument({...fixture(),name:name+'/private'},project,products)).toThrow();
    expect(()=>decodePublicDocument({...fixture(),fields:{...fixture().fields,private:{stringValue:'bad'}}},project,products)).toThrow();
    expect(()=>decodePublicDocument({...fixture(),fields:{...fixture().fields,revision:{integerValue:'9007199254740992'}}},project,products)).toThrow();
    expect(()=>decodePublicDocument({...fixture(),fields:{...fixture().fields,revision:{doubleValue:2}}},project,products)).toThrow();
    expect(()=>decodePublicDocument({...fixture(),fields:{...fixture().fields,updatedAt:{integerValue:'123'}}},project,products)).toThrow();
  });
  it('rejects future offer timestamp within the same millisecond and invalid calendar dates',()=>{
    const f=fixture();f.fields.offers.mapValue.fields['mutton-bone'].mapValue.fields.priceUpdatedAt=ts('2026-11-28T06:00:00.123456790Z');
    expect(()=>decodePublicDocument(f,project,products)).toThrow();
    expect(()=>decodePublicDocument({...fixture(),fields:{...fixture().fields,updatedAt:ts('2026-02-30T06:00:00Z')}},project,products)).toThrow();
  });
  it('uses one no-store unauthenticated GET with no redirect, cookies or referrer',async()=>{
    const request=vi.fn(async()=>new Response(JSON.stringify(fixture())));
    expect((await readPublicDocument(project,'fixture',products,request)).revision).toBe(2);
    expect(request).toHaveBeenCalledTimes(1);
    const [url,init]=request.mock.calls[0] as unknown as [URL,RequestInit];
    expect(url.origin).toBe('https://firestore.googleapis.com');
    expect(url.pathname).toBe('/v1/'+name);
    expect(init).toMatchObject({method:'GET',cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
    expect(init.headers).toBeUndefined();
  });
  it('fails closed on missing, denied, malformed, oversized or unreachable data',async()=>{
    for(const response of [new Response('{}',{status:404}),new Response('{}',{status:403}),new Response('not-json'),new Response('x'.repeat(65537))]){
      await expect(readPublicDocument(project,'fixture',products,async()=>response)).rejects.toThrow();
    }
    await expect(readPublicDocument(project,'fixture',products,async()=>{throw Error('offline')})).rejects.toThrow();
    await expect(readPublicDocument('../private','fixture',products,async()=>new Response('{}'))).rejects.toThrow();
  });
});
