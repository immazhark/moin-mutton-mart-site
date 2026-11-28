import {useEffect,useRef,useState,type ChangeEvent} from 'react';
import {GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signOut,type User} from 'firebase/auth';
import {LogOut,RefreshCw,Download,Upload,ShieldCheck,Save,Store,AlertCircle} from 'lucide-react';
import {getFirebaseServices,type FirebaseServices} from '../lib/catalogue/firebase-browser';
import {getActiveMembership,getCatalogueFromServer,saveCatalogue} from '../lib/catalogue/firestore';
import {buildDraft,decodeBackup,encodeBackup,formFromCatalogue,formFromDraft,MAX_BACKUP_BYTES,visibilityOptions,availabilityOptions,type OwnerForm,type OfferForm} from '../lib/catalogue/owner-form';
import {planPublication,type SaveIntent} from '../lib/catalogue/publication';
import type {Catalogue} from '../lib/catalogue/contract';
import {products,categories} from '../data/products';
import {clearRecovery,readRecovery,storeRecovery} from '../lib/catalogue/owner-recovery';

type AuthState = {kind:'loading'}|{kind:'unconfigured'}|{kind:'error'}|{kind:'ready';services:FirebaseServices;user:User|null};
function messageForAuth(error:unknown):string{
  const code=(error as {code?:unknown}|null)?.code;
  if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request')return 'Sign-in was cancelled. Try again when ready.';
  if(code==='auth/popup-blocked')return 'Your browser blocked the sign-in window. Open this page in Safari or Chrome, allow pop-ups for this site and try again.';
  if(code==='auth/unauthorized-domain')return 'Sign-in is not configured for this address. Contact the site administrator.';
  return 'Could not sign in. Check your connection and try again.';
}
export default function OwnerConsole(){
  const [auth,setAuth]=useState<AuthState>({kind:'loading'});
  const [authError,setAuthError]=useState('');
  const [signing,setSigning]=useState(false);
  const signLock=useRef(false);
  useEffect(()=>{
    try{
      const services=getFirebaseServices();
      if(!services){setAuth({kind:'unconfigured'});return;}
      return onAuthStateChanged(services.auth,user=>{if(!user)clearRecovery();setAuth({kind:'ready',services,user});setAuthError('');},()=>setAuth({kind:'error'}));
    }catch{setAuth({kind:'error'});}
  },[]);
  async function login(services:FirebaseServices){
    if(signLock.current)return;
    signLock.current=true;setSigning(true);setAuthError('');
    try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(services.auth,provider);}
    catch(error){setAuthError(messageForAuth(error));}
    finally{signLock.current=false;setSigning(false);}
  }
  if(auth.kind==='loading')return <p role="status">Checking your session…</p>;
  if(auth.kind==='unconfigured')return <section className="owner-panel"><ShieldCheck size={30}/><h2>Owner access is not connected</h2><p>This build has no approved Firebase configuration. No catalogue changes can be made here.</p></section>;
  if(auth.kind==='error')return <section className="owner-panel"><h2>Could not start secure access</h2><p>Refresh the page or contact the site administrator.</p><button className="owner-secondary" onClick={()=>window.location.reload()}>Refresh page</button></section>;
  if(!auth.user)return <section className="owner-panel owner-login"><ShieldCheck size={32}/><h2>Sign in to manage the shop</h2><p>Use your authorised Google account. Signing in alone does not grant editing access.</p><button className="owner-primary" disabled={signing} onClick={()=>void login(auth.services)}>{signing?'Opening Google…':'Continue with Google'}</button>{authError&&<p role="alert" className="owner-error">{authError}</p>}<p className="owner-muted">Your session is kept for this browser tab. Sign out when using a shared device.</p></section>;
  return <OwnerEditor key={auth.user.uid} services={auth.services} user={auth.user}/>;
}
type LoadState='loading'|'ready'|'denied'|'error'|'refresh-required';
type SaveState='idle'|'saving'|'uncertain'|'conflict';
function OwnerEditor({services,user}:{services:FirebaseServices;user:User}){
  const [load,setLoad]=useState<LoadState>('loading');
  const [base,setBase]=useState<Catalogue|null>(null);
  const [form,setForm]=useState<OwnerForm|null>(null);
  const [saveState,setSaveState]=useState<SaveState>('idle');
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [checking,setChecking]=useState(false);
  const pending=useRef<SaveIntent|null>(null);
  const recoveryChecked=useRef(false),pendingSince=useRef(0),recoveryStored=useRef(false);
  const [category,setCategory]=useState<(typeof categories)[number]>('All');
  const [search,setSearch]=useState('');
  const [changedOnly,setChangedOnly]=useState(false);
  const [recoveryWarning,setRecoveryWarning]=useState(false);
  const scope={projectId:services.db.app.options.projectId??'',uid:user.uid};
  const alive=useRef(false), serial=useRef(0), busy=useRef(false), memberCheck=useRef(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const operationBusy=saveState==='saving'||checking||load==='loading';
  const savedForm=base?formFromCatalogue(base):null;
  const dirty=!!(form&&savedForm&&JSON.stringify(form)!==JSON.stringify(savedForm));
  const changedIds=new Set(form&&savedForm?products.filter(p=>JSON.stringify(form.offers[p.id])!==JSON.stringify(savedForm.offers[p.id])).map(p=>p.id):[]);
  const visibleProducts=products.filter(p=>(category==='All'||p.category===category)&&
    p.name.toLowerCase().includes(search.trim().toLowerCase())&&(!changedOnly||changedIds.has(p.id)));
  const unresolved=saveState==='uncertain';
  const missingBasis=products.filter(p=>!p.pricingBasis);
  const isCurrent=()=>alive.current&&services.auth.currentUser?.uid===user.uid;
  function deny(){
    if(!isCurrent())return;
    serial.current++;pending.current=null;clearRecovery();setRecoveryWarning(false);setBase(null);setForm(null);setSaveState('idle');setLoad('denied');setError('');setNotice('');
  }
  async function refresh(discard=false){
    if(busy.current||memberCheck.current)return;
    if(!discard&&pending.current)return;
    busy.current=true;const version=++serial.current;setChecking(true);setError('');
    try{
      const member=await getActiveMembership(services.db,user.uid);
      if(!isCurrent()||version!==serial.current)return;
      if(!member){deny();return;}
      const catalogue=await getCatalogueFromServer(services.db,products);
      if(!isCurrent()||version!==serial.current)return;
      setBase(catalogue);setLoad('ready');
      if(!recoveryChecked.current){
        recoveryChecked.current=true;
        const recovery=readRecovery(scope,products);
        if(recovery.kind==='pending'){
          pending.current=recovery.record.intent;pendingSince.current=recovery.record.createdAt;recoveryStored.current=true;
          setForm(formFromDraft(recovery.record.intent.draft));setSaveState('uncertain');
          setError('An interrupted save was recovered. Verify / retry checks the exact previous operation; nothing is sent automatically.');
          return;
        }
        if(recovery.kind==='invalid'){
          setRecoveryWarning(true);
          setNotice('A previous recovery record could not be restored. Check the latest catalogue and have the previous audit verified before making another save.');
        }
      }
      pending.current=null;setForm(formFromCatalogue(catalogue));setSaveState('idle');
    }catch{
      if(isCurrent()&&version===serial.current){setLoad(current=>current==='ready'||current==='refresh-required'?'refresh-required':'error');setError('Could not verify access or load the latest catalogue. Check your connection and retry.');}
    }finally{busy.current=false;if(isCurrent())setChecking(false);}
  }
  useEffect(()=>{
    alive.current=true;void refresh();
    return()=>{alive.current=false;serial.current++;busy.current=false;};
    // The editor is keyed to the authenticated UID and service instance.
  },[services,user.uid]);
  useEffect(()=>{
    async function verify(){
      if(document.visibilityState!=='visible'||busy.current||memberCheck.current||load!=='ready')return;
      memberCheck.current=true;setChecking(true);
      try{if(!await getActiveMembership(services.db,user.uid))deny();}
      catch{if(isCurrent()){setError('Access could not be reverified. Reconnect and retry before editing or saving.');setLoad('refresh-required');}}
      finally{memberCheck.current=false;if(isCurrent())setChecking(false);}
    }
    const onVisible=()=>{void verify();};
    document.addEventListener('visibilitychange',onVisible);window.addEventListener('focus',onVisible);
    return()=>{document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('focus',onVisible);};
  },[load,services,user.uid]);
  useEffect(()=>{
    if(!dirty&&!unresolved&&saveState!=='saving')return;
    const protect=(event:BeforeUnloadEvent)=>{event.preventDefault();};
    window.addEventListener('beforeunload',protect);
    return()=>window.removeEventListener('beforeunload',protect);
  },[dirty,unresolved,saveState]);
  function patch(id:string,change:Partial<OfferForm>){
    if(busy.current||memberCheck.current||saveState!=='idle'||load!=='ready')return;
    setForm(previous=>previous?{...previous,offers:{...previous.offers,[id]:{...previous.offers[id],...change}}}:previous);setError('');setNotice('');
  }
  async function save(retry=false){
    if(busy.current||memberCheck.current||!base||!form||load!=='ready'&&!retry)return;
    let intent=pending.current;
    if(!retry){
      if(saveState!=='idle'||intent||recoveryWarning)return;
      try{
        const draft=buildDraft(form,products);
        intent={expectedRevision:base.revision,operationId:crypto.randomUUID(),draft};
        const decision=planPublication(base,intent,user.uid,null,products);
        if(decision.kind==='unchanged'){setForm(formFromCatalogue(base));setNotice('No changes to save.');return;}
      }catch(e){setError(e instanceof Error?e.message:'Check the catalogue fields.');return;}
      pending.current=intent;pendingSince.current=Date.now();
    }
    if(!intent)return;
    // Record before starting any asynchronous save; never extend the original TTL.
    recoveryStored.current=storeRecovery(scope,intent,products,pendingSince.current);
    busy.current=true;setSaveState('saving');setError('');setNotice('');
    let result;
    try{
      if(!await getActiveMembership(services.db,user.uid)){deny();return;}
      if(!isCurrent())return;
      result=await saveCatalogue(services.db,user.uid,intent,products);
    }catch{
      if(isCurrent()){setSaveState('uncertain');setError('The save outcome could not be verified. Retry this exact save to check whether it already committed. No new operation will be created. '+(recoveryStored.current?'Recovery is available in this tab for up to two hours from the first attempt.':'Recovery storage is unavailable. Keep this tab open and retry; if it closes, check the audit before making another save.'));}
      return;
    }finally{busy.current=false;}
    if(!isCurrent())return;
    pending.current=null;clearRecovery();recoveryStored.current=false;
    if(result.kind==='conflict'){setSaveState('conflict');setError('Another editor updated the catalogue. Your draft is preserved. Export it if needed, then reload the latest version and review changes before saving.');return;}
    setSaveState('idle');
    setNotice(result.kind==='unchanged'?'No changes to save.':'Saved successfully. Revision '+result.revision+'.'+(result.kind==='already_committed'?' The earlier save was already committed.':''));
    await refresh(true);
  }
  function exportDraft(){
    if(!form||!isCurrent())return;
    try{
      const json=encodeBackup(buildDraft(form,products),products);
      const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='moin-catalogue-private.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Private backup exported. Keep it somewhere safe.');
    }catch(e){setError(e instanceof Error?e.message:'Backup could not be exported.');}
  }
  async function importDraft(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value='';
    if(!file||busy.current||memberCheck.current||saveState!=='idle'||load!=='ready')return;
    if(dirty&&!window.confirm('Replace your unsaved draft with the backup?'))return;
    busy.current=true;setChecking(true);
    try{
      if(file.size>MAX_BACKUP_BYTES)throw Error('Backup file is too large.');
      const restored=decodeBackup(await file.text(),products);
      if(isCurrent()){setForm(formFromDraft(restored));setNotice('Backup loaded into the draft. Review all changes before saving. Nothing has been published.');setError('');}
    }catch(e){if(isCurrent())setError(e instanceof Error?e.message:'Invalid backup.');}
    finally{busy.current=false;if(isCurrent())setChecking(false);}
  }
  async function leave(){
    if(busy.current||memberCheck.current)return;
    if((dirty||unresolved)&&!window.confirm('Sign out and discard the local draft and recovery record? An uncertain save may already have committed. Check its audit before another save.'))return;
    busy.current=true;setChecking(true);
    try{await signOut(services.auth);clearRecovery();}catch{if(isCurrent())setError('Sign-out failed. Try again.');}
    finally{busy.current=false;if(isCurrent())setChecking(false);}
  }
  const controlsDisabled=operationBusy||saveState!=='idle'||load!=='ready';
  return <section className="owner-console">
    <div className="owner-session"><div><strong>Owner session</strong><small>Signed in with Google</small></div><button className="owner-secondary" disabled={operationBusy} onClick={()=>void leave()}><LogOut size={17}/> Sign out</button></div>
    {notice&&<p className="owner-success" role="status">{notice}</p>}
    {error&&<p className="owner-error" role="alert"><AlertCircle size={18}/>{error}</p>}
    {load==='loading'&&<p role="status">Checking administrator access…</p>}
    {load==='denied'&&<section className="owner-panel"><h2>Access not authorised</h2><p>This account is not an active shop administrator. Sign out and use the authorised account.</p></section>}
    {load==='error'&&<section className="owner-panel"><h2>Catalogue unavailable</h2><button className="owner-secondary" disabled={checking} onClick={()=>void refresh()}>Retry connection</button></section>}
    {form&&base&&load!=='denied'&&<>
      <div className="owner-summary"><div><small>Catalogue revision</small><strong>{base.revision}</strong></div><div><small>Products</small><strong>{products.length}</strong></div><div><small>Draft</small><strong>{dirty?'Unsaved':'Up to date'}</strong></div></div>
      {missingBasis.length>0&&<p className="owner-warning">Publication is locked until the charging units are approved for {missingBasis.length} products. You can prepare and export a draft; no unconfirmed rates will be published.</p>}
      {load==='refresh-required'&&!unresolved&&<p className="owner-warning">Editing is paused until access and current data are verified. Export your draft before reloading if you need to retain changes.</p>}
      <fieldset className="owner-panel owner-settings" disabled={controlsDisabled}><legend><Store size={18}/> Shop settings</legend>
        <label className="owner-toggle"><input type="checkbox" checked={form.acceptingRequests} onChange={e=>{setForm({...form,acceptingRequests:e.target.checked});setNotice('');}}/> Accept customer requests</label>
        <label className="owner-toggle"><input type="checkbox" checked={form.showPrices} onChange={e=>{setForm({...form,showPrices:e.target.checked});setNotice('');}}/> Show saved rates by default</label>
        <p className="owner-muted">Hiding rates changes their display, not the public data. Stock is manual, never reserved or deducted automatically.</p>
      </fieldset>
      {recoveryWarning&&<section className="owner-panel" aria-label="Previous save needs review"><h2>Check the previous save</h2><p>Review the latest rates and ask the site administrator to verify the prior audit before enabling publication.</p><button className="owner-secondary" disabled={operationBusy||load!=='ready'} onClick={()=>{setRecoveryWarning(false);setNotice('Previous save review acknowledged.');}}>I have checked the previous save</button></section>}
      <div className="owner-section-title"><h2>Today's counter</h2><span>{changedIds.size} of {products.length} items changed</span></div>
      <div className="owner-tools">
        <label className="owner-search">Find a product<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search the range"/></label>
        <div className="owner-filters" role="group" aria-label="Product category">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <label className="owner-toggle"><input type="checkbox" checked={changedOnly} onChange={e=>setChangedOnly(e.target.checked)}/> Changed only</label>
        <p className="owner-muted" role="status">{visibleProducts.length} of {products.length} items shown. Filters never change the draft.</p>
      </div>
      {!visibleProducts.length&&<p className="owner-panel">No matching products. Change the filters to see the range.</p>}
      <div className="owner-grid">{products.map(product=>{
        const o=form.offers[product.id];const unit=product.unit==='g'?'grams':product.unit==='piece'?'pieces':'sets';
        return <fieldset className="owner-product" key={product.id} hidden={!visibleProducts.includes(product)} disabled={controlsDisabled}>
          <legend>{product.name}</legend>{changedIds.has(product.id)&&<span className="owner-changed">Edited</span>}<p className="owner-muted">{product.category} · Rate basis: {product.pricingBasis??'unconfirmed'}</p>
          <label className="owner-toggle"><input type="checkbox" checked={o.enabled} onChange={e=>patch(product.id,{enabled:e.target.checked})}/> Listed in shop</label>
          <div className="owner-fields"><label>Rate (₹)<input aria-label={product.name+' rate in rupees'} inputMode="decimal" maxLength={10} value={o.price} onChange={e=>patch(product.id,{price:e.target.value})} placeholder="No rate"/></label>
          <label>Availability<select aria-label={product.name+' availability'} value={o.availability} onChange={e=>patch(product.id,{availability:e.target.value as OfferForm['availability']})}>{availabilityOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
          <label>Stock ({unit})<input aria-label={product.name+' stock in '+unit} inputMode="numeric" maxLength={10} value={o.stock} onChange={e=>patch(product.id,{stock:e.target.value})} placeholder="Unknown"/></label><small className="owner-muted">Blank = unknown. Zero = none available.</small>
          <details><summary>Rate visibility</summary>
            <label>Rate display<select aria-label={product.name+' rate display'} value={o.priceVisibility} onChange={e=>patch(product.id,{priceVisibility:e.target.value as OfferForm['priceVisibility']})}>{visibilityOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          </details>
        </fieldset>;
      })}</div>
      <section className="owner-panel owner-backup"><h2>Private backup</h2><p>Export a validated draft to your device or load a backup for review. Restoring never bypasses the normal audited save.</p><div className="owner-actions"><button className="owner-secondary" disabled={operationBusy} onClick={exportDraft}><Download size={17}/> Export draft</button><button className="owner-secondary" disabled={controlsDisabled} onClick={()=>fileRef.current?.click()}><Upload size={17}/> Load backup</button><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e=>void importDraft(e)}/></div></section>
      <div className="owner-save"><div><strong>{unresolved?'Save needs verification':saveState==='conflict'?'Revision conflict':dirty?'Unsaved changes':'All changes saved'}</strong><small>{missingBasis.length?'Charging units need approval':unresolved?'Check the same operation, never a duplicate':'Changes publish together'}</small></div><div className="owner-actions">
        {!unresolved&&<button className="owner-secondary" disabled={operationBusy} onClick={()=>{if(!dirty||window.confirm('Discard this draft and load the current catalogue?'))void refresh(true);}}><RefreshCw size={17}/> Reload</button>}
        <button className="owner-primary" disabled={operationBusy||saveState==='conflict'||(!unresolved&&(!dirty||missingBasis.length>0||load!=='ready'||recoveryWarning))} onClick={()=>void save(unresolved)}><Save size={17}/>{saveState==='saving'?'Saving…':unresolved?'Verify / retry':'Save changes'}</button>
      </div></div>
    </>}
  </section>;
}
