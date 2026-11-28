import {parseCatalogue,type Catalogue} from './contract';
import type {Product} from '../order/order';
import {getPublicConfig} from './public-config';

const MAX_DOCUMENT_BYTES=65536;
const TIMEOUT_MS=8000;
const fail=():never=>{throw Error('Invalid public catalogue document');};
type Fields=Record<string,unknown>;
type Stamp={seconds:number;nanos:number};
function record(value:unknown):Fields{
  if(typeof value!=='object'||value===null||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return fail();
  return value as Fields;
}
function wire(value:unknown):[string,unknown]{
  const fields=record(value);
  const keys=Object.keys(fields);
  if(keys.length!==1)return fail();
  return [keys[0],fields[keys[0]]];
}
function stamp(value:unknown):Stamp{
  const [type,raw]=wire(value);
  if(type!=='timestampValue'||typeof raw!=='string')return fail();
  const match=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(raw);
  if(!match)return fail();
  const ms=Date.parse(match[1]+'Z');
  if(!Number.isFinite(ms)||ms<0||new Date(ms).toISOString().slice(0,19)!==match[1])return fail();
  return {seconds:ms/1000,nanos:Number((match[2]??'').padEnd(9,'0'))};
}
function millis(t:Stamp){return t.seconds*1000+Math.floor(t.nanos/1000000);}
function noLater(t:Stamp,limit:Stamp):number{
  if(t.seconds>limit.seconds||(t.seconds===limit.seconds&&t.nanos>limit.nanos))return fail();
  return millis(t);
}
function scalar(value:unknown):unknown{
  const [kind,data]=wire(value);
  if(kind==='nullValue'&&data===null)return null;
  if(kind==='booleanValue'&&typeof data==='boolean')return data;
  if(kind==='stringValue'&&typeof data==='string')return data;
  if(kind==='integerValue'&&typeof data==='string'&&/^-?(?:0|[1-9]\d*)$/.test(data)){
    const n=Number(data);
    if(Number.isSafeInteger(n))return n;
  }
  return fail();
}
function map(value:unknown):Fields{
  const [kind,data]=wire(value);
  if(kind!=='mapValue')return fail();
  const m=record(data);
  if(Object.keys(m).length!==1||!Object.hasOwn(m,'fields'))return fail();
  return record(m.fields);
}
function documentName(projectId:string):string{
  if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId))return fail();
  return 'projects/'+projectId+'/databases/(default)/documents/public/catalogue';
}
/** The wire decoder must agree with the authenticated SDK's normalized contract.
 * It accepts no arbitrary field types, paths, maps, or future offer timestamps. */
export function decodePublicDocument(value:unknown,projectId:string,products:readonly Product[]):Catalogue{
  const doc=record(value);
  if(doc.name!==documentName(projectId))return fail();
  const fields=record(doc.fields);
  const updatedAt=stamp(fields.updatedAt);
  const normalized=Object.fromEntries(Object.entries(fields).map(([key,field])=>{
    if(key==='updatedAt')return [key,millis(updatedAt)];
    if(key==='offers'){
      const offers=Object.fromEntries(Object.entries(map(field)).map(([id,offer])=>[id,
        Object.fromEntries(Object.entries(map(offer)).map(([k,v])=>[k,k==='priceUpdatedAt'||k==='availabilityUpdatedAt'?noLater(stamp(v),updatedAt):scalar(v)]))
      ]));
      return [key,offers];
    }
    return [key,scalar(field)];
  }));
  return parseCatalogue(normalized,products);
}
/** One anonymous fixed-document GET. No SDK, token, list, polling or persistent cache.
 * A Firebase web API key is a public project identifier, not authorization. */
export async function readPublicDocument(projectId:string,apiKey:string,products:readonly Product[],request:typeof fetch=fetch):Promise<Catalogue>{
  if(!apiKey||!/^[^\s]+$/.test(apiKey))return fail();
  const url=new URL('https://firestore.googleapis.com/v1/'+documentName(projectId));
  url.searchParams.set('key',apiKey);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const response=await request(url,{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
    if(!response.ok||response.redirected)throw Error('Fresh catalogue unavailable');
    const declared=response.headers.get('content-length');
    if(declared!==null&&Number(declared)>MAX_DOCUMENT_BYTES)return fail();
    // Bound decompressed bytes as well as the advertised response length.
    if(!response.body)return fail();
    const reader=response.body.getReader();
    const decoder=new TextDecoder('utf-8',{fatal:true});
    let size=0,body='';
    try{
      for(;;){
        const {value,done}=await reader.read();
        if(done)break;
        size+=value.byteLength;
        if(size>MAX_DOCUMENT_BYTES){await reader.cancel();return fail();}
        body+=decoder.decode(value,{stream:true});
      }
      body+=decoder.decode();
    }finally{reader.releaseLock();}
    return decodePublicDocument(JSON.parse(body),projectId,products);
  }finally{clearTimeout(timeout);}
}
export function loadPublicCatalogue(products:readonly Product[]):Promise<Catalogue>{
  const config=getPublicConfig();
  if(!config)return Promise.reject(Error('Live catalogue is not configured'));
  return readPublicDocument(config.projectId,config.apiKey,products);
}
