import {initializeApp,getApps,type FirebaseOptions,type FirebaseApp} from 'firebase/app';
import {getPublicConfig} from './public-config';
export function getFirebaseApp(purpose:'public'|'owner'='public'):FirebaseApp|null {
  const config=getPublicConfig();
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
