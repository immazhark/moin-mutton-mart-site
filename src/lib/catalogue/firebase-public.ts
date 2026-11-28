import {initializeApp,getApps,type FirebaseOptions,type FirebaseApp} from 'firebase/app';
import {getFirestore,type Firestore} from 'firebase/firestore';
export type PublicConfig = {apiKey:string;authDomain:string;projectId:string;appId:string;allowedHost:string};
const productionProject='moin-mutton-mart';
const productionHost='moinmuttonmart.in';
const dnsName=(value:string):boolean=>value.length<=253&&value.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
const nonWhitespace=(value:string):boolean=>/^\S+$/.test(value);
/** Fail closed on unconfigured or accidental production-preview builds. */
export function validatePublicConfig(raw:Partial<PublicConfig>,hostname:string):PublicConfig|null {
  const {apiKey,authDomain,projectId,appId,allowedHost}=raw;
  if(!apiKey||!authDomain||!projectId||!appId||!allowedHost||hostname!==allowedHost) return null;
  if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)||!dnsName(authDomain)||!dnsName(allowedHost)||!nonWhitespace(apiKey)||!nonWhitespace(appId))return null;
  if((projectId===productionProject)!==(hostname===productionHost)) return null;
  // Independent previews must use their own Firebase-hosted authentication handler.
  // A production custom authDomain requires a separately verified handler setup.
  if(authDomain!==projectId+'.firebaseapp.com'&&!(projectId===productionProject&&authDomain===productionHost))return null;
  return {apiKey,authDomain,projectId,appId,allowedHost};
}
export function getFirebaseApp(purpose:'public'|'owner'='public'):FirebaseApp|null {
  if(typeof window==='undefined')return null;
  const {protocol,hostname}=window.location;
  if(protocol!=='https:'&&!(protocol==='http:'&&(hostname==='127.0.0.1'||hostname==='localhost')))return null;
  const config=validatePublicConfig({
    apiKey:import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain:import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    appId:import.meta.env.PUBLIC_FIREBASE_APP_ID,
    allowedHost:import.meta.env.PUBLIC_FIREBASE_ALLOWED_HOST,
  },window.location.hostname);
  if(!config)return null;
  const options:FirebaseOptions={apiKey:config.apiKey,authDomain:config.authDomain,projectId:config.projectId,appId:config.appId};
  // A separate name also separates Auth persistence; the public catalogue never
  // needs the owner's authenticated Firebase app.
  const name='moin-'+purpose;
  const existing=getApps().find(app=>app.name===name);
  if(existing){
    const current=existing.options;
    if(current.apiKey!==options.apiKey||current.authDomain!==options.authDomain||current.projectId!==options.projectId||current.appId!==options.appId)return null;
    return existing;
  }
  return initializeApp(options,name);
}
export function getPublicFirestore():Firestore|null {
  const app=getFirebaseApp();
  return app?getFirestore(app):null;
}
