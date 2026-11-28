import {decodeBackup,MAX_BACKUP_BYTES} from './owner-form';
import type {CatalogueDraft,SaveIntent} from './publication';
import type {Product} from '../order/order';

export const RECOVERY_KEY='moin-owner-pending-v1';
export const RECOVERY_TTL_MS=2*60*60*1000;
export type RecoveryScope={projectId:string;uid:string};
export type RecoveryIntent=SaveIntent&{draft:CatalogueDraft};
export type RecoveryRecord={createdAt:number;intent:RecoveryIntent};

function exact(value:unknown,keys:readonly string[]):Record<string,unknown>{
  if(typeof value!=='object'||value===null||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value))||
     Reflect.ownKeys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k)))throw Error('Invalid recovery record');
  return value as Record<string,unknown>;
}
function validScope(scope:RecoveryScope){
  return /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(scope.projectId)&&
    typeof scope.uid==='string'&&scope.uid.length>0&&scope.uid.length<=128&&!scope.uid.includes('/');
}
function validatedIntent(value:unknown,products:readonly Product[]):RecoveryIntent{
  const i=exact(value,['expectedRevision','operationId','draft']);
  const revision=i.expectedRevision;
  if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<1||revision>=Number.MAX_SAFE_INTEGER||
     typeof i.operationId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(i.operationId))throw Error('Invalid recovery intent');
  const draft=decodeBackup(JSON.stringify({format:'moin-catalogue-backup',version:1,draft:i.draft}),products);
  return {expectedRevision:revision,operationId:i.operationId,draft};
}
/** Only a validated, explicitly submitted operation. No tokens, email, or ordinary draft.
 * Same-tab sessionStorage is a best-effort recovery aid, not a secure vault or queue. */
export function encodeRecovery(scope:RecoveryScope,intent:SaveIntent,products:readonly Product[],createdAt=Date.now()):string{
  if(!validScope(scope)||!Number.isSafeInteger(createdAt)||createdAt<0)throw Error('Invalid recovery scope or time');
  const raw=JSON.stringify({version:1,projectId:scope.projectId,uid:scope.uid,createdAt,intent:validatedIntent(intent,products)});
  if(new TextEncoder().encode(raw).length>MAX_BACKUP_BYTES)throw Error('Recovery record too large');
  return raw;
}
export function decodeRecovery(raw:string|null,scope:RecoveryScope,products:readonly Product[],now=Date.now()):RecoveryRecord|null{
  try{
    if(!raw||new TextEncoder().encode(raw).length>MAX_BACKUP_BYTES||!validScope(scope)||!Number.isSafeInteger(now))return null;
    const value=exact(JSON.parse(raw),['version','projectId','uid','createdAt','intent']);
    const createdAt=value.createdAt;
    if(value.version!==1||value.projectId!==scope.projectId||value.uid!==scope.uid||
       typeof createdAt!=='number'||!Number.isSafeInteger(createdAt)||createdAt<0||createdAt>now||now-createdAt>RECOVERY_TTL_MS)return null;
    return {createdAt,intent:validatedIntent(value.intent,products)};
  }catch{return null;}
}
export function clearRecovery():void{
  try{sessionStorage.removeItem(RECOVERY_KEY);}catch{/* Storage may be unavailable. */}
}
export function storeRecovery(scope:RecoveryScope,intent:SaveIntent,products:readonly Product[],createdAt:number):boolean{
  try{const now=Date.now();if(createdAt>now||now-createdAt>RECOVERY_TTL_MS){clearRecovery();return false;}sessionStorage.setItem(RECOVERY_KEY,encodeRecovery(scope,intent,products,createdAt));return true;}
  catch{return false;}
}
export function readRecovery(scope:RecoveryScope,products:readonly Product[]):{kind:'none'|'invalid'|'unavailable'}|{kind:'pending';record:RecoveryRecord}{
  try{
    const raw=sessionStorage.getItem(RECOVERY_KEY);
    if(raw===null)return {kind:'none'};
    const record=decodeRecovery(raw,scope,products);
    if(record)return {kind:'pending',record};
    clearRecovery();
    return {kind:'invalid'};
  }catch{return {kind:'unavailable'};}
}
