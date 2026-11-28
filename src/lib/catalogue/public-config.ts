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
export function getPublicConfig():PublicConfig|null {
  if(typeof window==='undefined')return null;
  const {protocol,hostname}=window.location;
  if(protocol!=='https:'&&!(protocol==='http:'&&(hostname==='127.0.0.1'||hostname==='localhost')))return null;
  return validatePublicConfig({
    apiKey:import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain:import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    appId:import.meta.env.PUBLIC_FIREBASE_APP_ID,
    allowedHost:import.meta.env.PUBLIC_FIREBASE_ALLOWED_HOST,
  },hostname);
}
