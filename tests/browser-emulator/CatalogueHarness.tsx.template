import {useEffect,useState} from 'react';
import {connectFirestoreEmulator,disableNetwork,enableNetwork} from 'firebase/firestore';
import {getPublicFirestore} from '../lib/catalogue/firebase-public';
import Catalogue from './Catalogue';

/** Copied only into a disposable, loopback QA build. Never in deployed src. */
export default function CatalogueHarness(){
  const [ready,setReady]=useState(false);
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(window.location.hostname!=='127.0.0.1'||import.meta.env.PUBLIC_FIREBASE_PROJECT_ID!=='demo-moin-security'){
      setError(true);return;
    }
    const db=getPublicFirestore();
    if(!db){setError(true);return;}
    connectFirestoreEmulator(db,'127.0.0.1',8088);
    const network=(event:Event)=>{
      const action=(event as CustomEvent<unknown>).detail;
      if(action!=='offline'&&action!=='online')return;
      void (action==='offline'?disableNetwork(db):enableNetwork(db)).then(()=>{
        document.documentElement.dataset.qaNetwork=action;
      }).catch(()=>setError(true));
    };
    window.addEventListener('qa-emulator-network',network);
    document.documentElement.dataset.qaNetwork='online';
    setReady(true);
    return()=>window.removeEventListener('qa-emulator-network',network);
  },[]);
  if(error)return <p role="alert">Isolated emulator harness unavailable.</p>;
  return ready?<Catalogue/>:<p>Starting isolated emulator harness…</p>;
}
