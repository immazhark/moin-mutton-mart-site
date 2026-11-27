import {initializeApp, getApps, type FirebaseOptions} from 'firebase/app';
import {getAuth, initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, type Auth} from 'firebase/auth';
import {getFirestore, type Firestore} from 'firebase/firestore';

export interface FirebaseServices {auth:Auth; db:Firestore}
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
let services:FirebaseServices|undefined;
export function getFirebaseServices():FirebaseServices|null {
  if(typeof window==='undefined') return null;
  const config=validatePublicConfig({
    apiKey:import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain:import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    appId:import.meta.env.PUBLIC_FIREBASE_APP_ID,
    allowedHost:import.meta.env.PUBLIC_FIREBASE_ALLOWED_HOST,
  },window.location.hostname);
  if(!config)return null;
  if(services)return services;
  const options:FirebaseOptions={apiKey:config.apiKey,authDomain:config.authDomain,projectId:config.projectId,appId:config.appId};
  const existing=getApps().find(app=>app.name==='moin-browser');
  const app=existing??initializeApp(options,'moin-browser');
  services={auth:existing?getAuth(app):initializeAuth(app,{persistence:browserSessionPersistence,popupRedirectResolver:browserPopupRedirectResolver}),db:getFirestore(app)};
  return services;
}
