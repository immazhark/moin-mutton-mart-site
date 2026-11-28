import {initializeAuth,browserSessionPersistence,browserPopupRedirectResolver,type Auth} from 'firebase/auth';
import {getFirestore,type Firestore} from 'firebase/firestore';
import {getFirebaseApp} from './firebase-public';
export {validatePublicConfig,type PublicConfig} from './firebase-public';

export interface FirebaseServices {auth:Auth;db:Firestore}
let services:FirebaseServices|undefined;
export function getFirebaseServices():FirebaseServices|null {
  const app=getFirebaseApp('owner');
  if(!app)return null;
  if(services)return services;
  services={auth:initializeAuth(app,{persistence:browserSessionPersistence,popupRedirectResolver:browserPopupRedirectResolver}),db:getFirestore(app)};
  return services;
}
