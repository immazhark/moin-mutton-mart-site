import {initializeApp,getApps,type FirebaseOptions,type FirebaseApp} from 'firebase/app';
import {getFirestore,type Firestore} from 'firebase/firestore';
export type PublicConfig = {apiKey:string;authDomain:string;projectId:string;appId:string;allowedHost:string};
const productionProject='moin-mutton-mart';
const productionHost='moinmuttonmart.in';
/** Fail closed on unconfigured or accidental production-preview builds. */
export function validatePublicConfig(raw:Partial<PublicConfig>,hostname:string):PublicConfig|null {
  const {apiKey,authDomain,projectId,appId,allowedHost}=raw;
  if(!apiKey||!authDomain||!projectId||!appId||!allowedHost||hostname!==allowedHost) return null;
  if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(projectId)||! /^[a-z0-9.-]+$/.test(authDomain)||! /^[a-z0-9.-]+$/.test(allowedHost)) return null;
  if((projectId===productionProject)!==(hostname===productionHost)) return null;
  if(projectId===productionProject&&authDomain!==productionHost&&authDomain!==productionProject+'.firebaseapp.com') return null;
  return {apiKey,authDomain,projectId,appId,allowedHost};
}
export function getFirebaseApp():FirebaseApp|null {
  if(typeof window==='undefined')return null;
  const config=validatePublicConfig({
    apiKey:import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain:import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    appId:import.meta.env.PUBLIC_FIREBASE_APP_ID,
    allowedHost:import.meta.env.PUBLIC_FIREBASE_ALLOWED_HOST,
  },window.location.hostname);
  if(!config)return null;
  const options:FirebaseOptions={apiKey:config.apiKey,authDomain:config.authDomain,projectId:config.projectId,appId:config.appId};
  return getApps().find(app=>app.name==='moin-browser')??initializeApp(options,'moin-browser');
}
export function getPublicFirestore():Firestore|null {
  const app=getFirebaseApp();
  return app?getFirestore(app):null;
}
