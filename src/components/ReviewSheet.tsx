import { Check, Copy, MessageCircle, Phone, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { CopySession } from '../lib/order/copy-session';
import {
  MAX_LINE_NOTE,
  MAX_ORDER_NOTE,
  buildWhatsAppUrl,
  formatRequest,
  linkFits,
  type Fulfilment,
  type Product,
  type Selection,
} from '../lib/order/order';
import Stepper from './Stepper';
import {reviewChanges,requestEstimate,type CatalogueSnapshot} from '../lib/catalogue/freshness';
import {assessQuantity,displayedRate,type Catalogue} from '../lib/catalogue/contract';

const FULFILMENT_OPTIONS: { value: Fulfilment; label: string }[] = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'discuss', label: 'Not sure yet' },
];

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  products: readonly Product[];
  items: Selection[];
  live: CatalogueSnapshot;
  /** Last server result for conservative negative constraints only. */
  known: Catalogue|null;
  refresh: () => Promise<CatalogueSnapshot>;
  onChange: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onClose: () => void;
  onRequestClose: () => void;
}

export default function ReviewSheet({ dialogRef, products, items, live, known, refresh, onChange, onRemove, onNote, onClose, onRequestClose }: Props) {
  const [fulfilment, setFulfilment] = useState<Fulfilment>('discuss');
  const [orderNote, setOrderNote] = useState('');
  const [copySession] = useState(() => new CopySession());
  const { busy: copying, result: copyState } = useSyncExternalStore(copySession.subscribe, copySession.getSnapshot, copySession.getSnapshot);
  const [otherOpen, setOtherOpen] = useState<Set<string>>(new Set());

  const message = items.length ? formatRequest(products, items, fulfilment, orderNote) : '';
  const [checking,setChecking]=useState(false);
  const [reviewNotice,setReviewNotice]=useState<{key:string;text:string}|null>(null);
  const [grant,setGrant]=useState<{key:string;snapshot:CatalogueSnapshot;at:number;message:string}|null>(null);
  const busy=useRef(false);
  const currentMessage=useRef(message);
  const messageRevision=useRef(0);
  const actionNode=useRef<HTMLElement|null>(null);
  const restoreAction=useRef(false);
  const actionRef=useCallback((node:HTMLElement|null)=>{
    if(!node){restoreAction.current=actionNode.current===document.activeElement;actionNode.current=null;return;}
    actionNode.current=node;
    if(restoreAction.current&&dialogRef.current?.open){restoreAction.current=false;node.focus();}
  },[dialogRef]);
  const removalFocus=useRef(false);
  function remove(id:string){removalFocus.current=true;onRemove(id);}
  function changeQuantity(id:string,delta:-1|1){
    if(delta<0&&items.find(item=>item.productId===id)?.quantity===products.find(p=>p.id===id)?.step)removalFocus.current=true;
    onChange(id,delta);
  }
  useLayoutEffect(()=>{
    if(!removalFocus.current)return;
    removalFocus.current=false;
    const sheet=dialogRef.current;
    if(!sheet?.open)return;
    (sheet.querySelector<HTMLButtonElement>('.empty button')??sheet.querySelector<HTMLButtonElement>('.line .link-btn')??sheet.querySelector<HTMLButtonElement>('.icon-btn'))?.focus();
  },[items,dialogRef]);
  const current=live.kind==='ready'?live.catalogue:null;
  const selectionState=known?reviewChanges(known,known,products,items):null;
  const blocked=selectionState?.kind==='blocked';
  const validGrant=grant&&grant.key===message&&grant.snapshot===live&&!blocked?grant:null;
  const canLink=validGrant!==null&&linkFits(validGrant.message);
  const estimate=requestEstimate(current,products,items);
  useLayoutEffect(()=>{
    if(currentMessage.current===message)return;
    currentMessage.current=message;
    messageRevision.current++;
    setGrant(null);
    setReviewNotice(null);
  },[message]);
  useEffect(()=>{
    if(!grant)return;
    const expiry=window.setTimeout(()=>setGrant(previous=>previous===grant?null:previous),Math.max(0,15000-(Date.now()-grant.at)));
    return ()=>window.clearTimeout(expiry);
  },[grant]);

  async function checkLatest(){
    if(busy.current||!message)return;
    busy.current=true;setChecking(true);setGrant(null);setReviewNotice(null);
    const key=message;
    const revision=messageRevision.current;
    try{
      const next=await refresh();
      if(currentMessage.current!==key||messageRevision.current!==revision||!dialogRef.current?.open)return;
      if(next.kind!=='ready'){
        if(blocked){
          setReviewNotice({key,text:'Previously restricted selections could not be rechecked. Change or remove the affected items, retry, or call the shop.'});
          return;
        }
        setGrant({key,snapshot:next,at:Date.now(),message:key});
        setReviewNotice({key,text:'Live rates and availability could not be checked. You can send an unpriced enquiry and ask the shop to confirm.'});
        return;
      }
      const decision=reviewChanges(current,next.catalogue,products,items);
      if(decision.kind==='blocked'){
        setReviewNotice({key,text:'Some selections are not currently requestable. Change or remove the affected items before continuing.'});
        return;
      }
      if(decision.kind==='review'){
        const names=decision.changes.map(id=>products.find(p=>p.id===id)?.name??id);
        setReviewNotice({key,text:'Please review the current rates and availability for: '+names.join(', ')+'. Check again when ready.'});
        return;
      }
      const freshMessage=formatRequest(products,items,fulfilment,orderNote,requestEstimate(next.catalogue,products,items));
      setGrant({key,snapshot:next,at:Date.now(),message:freshMessage});
      setReviewNotice({key,text:'Current information checked. Final availability, weight and total are confirmed by the shop.'});
    }catch{
      if(currentMessage.current===key&&messageRevision.current===revision)setReviewNotice({key,text:'Could not verify this request. Try again or call the shop.'});
    }finally{busy.current=false;setChecking(false);}
  }

  useLayoutEffect(() => { copySession.setMessage(blocked ? '' : message); }, [copySession, message, blocked]);

  function copy() {
    if(!blocked)void copySession.copy((text) => navigator.clipboard.writeText(text));
  }

  return (
    <dialog ref={dialogRef} className="sheet" aria-labelledby="sheet-title" onClose={onClose} onCancel={(event) => { event.preventDefault(); onRequestClose(); }}>
      <div className="sheet-head">
        <h2 id="sheet-title">Your request</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onRequestClose}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>Nothing selected yet.</p>
          <button type="button" className="btn-primary" onClick={onRequestClose}>
            Back to the counter
          </button>
        </div>
      ) : (
        <>
          <ul className="lines">
            {items.map((s) => {
              const p = products.find((x) => x.id === s.productId)!;
              const assessment=known?assessQuantity(known,p,s.quantity):null;
              const next=known?assessQuantity(known,p,s.quantity+p.step):null;
              const rate=current&&p.pricingBasis?displayedRate(current,p.id):null;
              const chips = p.cuts ?? [];
              const showOther = chips.length === 0 || otherOpen.has(p.id) || (s.note !== '' && !chips.includes(s.note));
              return (
                <li key={p.id} className="line">
                  <div className="line-top">
                    <h3>{p.name}</h3>
                    <button type="button" className="link-btn" aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)}>
                      <Trash2 size={16} aria-hidden="true" /> Remove
                    </button>
                  </div>
                  <Stepper product={p} quantity={s.quantity} canIncrease={next?.kind!=='blocked'} onChange={(d) => changeQuantity(p.id, d)} />
                  {rate?.kind==='visible'&&p.pricingBasis&&<p className="unit-hint">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(rate.pricePaise/100)} / {p.pricingBasis}</p>}
                  {assessment?.kind==='blocked'&&<p className="qualify" role="alert">{!current?'Previously restricted. Check again, reduce or remove this item, or call the shop.':assessment.reason==='insufficient_stock'?'Requested quantity exceeds current stock. Reduce or remove this item.':'Not currently requestable. Check again, remove this item or contact the shop.'}</p>}
                  {chips.length > 0 && (
                    <div className="chips" role="group" aria-label={`Cut for ${p.name}`}>
                      {chips.map((c) => (
                        <button key={c} type="button" className="chip" aria-pressed={s.note === c} onClick={() => onNote(p.id, s.note === c ? '' : c)}>
                          {c}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="chip"
                        aria-pressed={showOther}
                        onClick={() => setOtherOpen((o) => new Set(o).add(p.id))}
                      >
                        Other
                      </button>
                    </div>
                  )}
                  {showOther && (
                    <label className="field">
                      <span>{chips.length ? 'Other preference' : 'Cut or preparation (optional)'}</span>
                      <input dir="auto" maxLength={MAX_LINE_NOTE} value={s.note} onChange={(e) => onNote(p.id, e.target.value)} />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>

          <fieldset className="fulfil">
            <legend>Pickup or delivery</legend>
            <div className="segmented">
              {FULFILMENT_OPTIONS.map((o) => (
                <button key={o.value} type="button" aria-pressed={fulfilment === o.value} onClick={() => setFulfilment(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <details className="note">
            <summary>Add a note (optional)</summary>
            <label className="field">
              <span className="sr-only">Order note</span>
              <textarea dir="auto" maxLength={MAX_ORDER_NOTE} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
            </label>
          </details>

          <p className="qualify">
            No payment here. Rates, availability and final weight are confirmed by the shop.
          </p>

          {estimate.kind==='complete'&&!blocked&&<p className="rate">Estimated total: {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(estimate.totalPaise/100)}</p>}
          {reviewNotice?.key===message&&<p className="qualify" role="status">{reviewNotice.text}</p>}
          {canLink && validGrant ? (
            <a ref={actionRef} className="btn-primary whatsapp" href={buildWhatsAppUrl(validGrant.message)} target="_blank" rel="noopener noreferrer"
              onClick={event=>{if(Date.now()-validGrant.at>15000||Date.now()<validGrant.at){event.preventDefault();void checkLatest();}}}>
              <MessageCircle size={20} aria-hidden="true" /> {validGrant.snapshot.kind==='ready'?'Continue on WhatsApp':'Continue as unpriced enquiry'}
            </a>
          ) : validGrant ? (
            <p ref={actionRef} tabIndex={-1} className="qualify" role="alert">This request is too long for a WhatsApp link. Copy the unpriced request or call the shop.</p>
          ) : (
            <button ref={actionRef} type="button" className="btn-primary whatsapp" aria-disabled={checking} onClick={()=>void checkLatest()}>
              <MessageCircle size={20} aria-hidden="true"/> {checking?'Checking latest information…':'Check latest rates & availability'}
            </button>
          )}
          <p className="destination">Opens a chat with +91 81437 30054. You send the message yourself.</p>

          <div className="fallbacks">
            <button type="button" className="btn-secondary" onClick={copy} disabled={copying||blocked}>
              {copyState === 'done' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} {copying ? 'Copying…' : 'Copy request'}
            </button>
            <a className="btn-secondary" href="tel:+918143730054">
              <Phone size={18} aria-hidden="true" /> Call instead
            </a>
          </div>
          <p className="destination">Copy request always copies an unpriced enquiry, not an estimate.</p>
          <p role="status" aria-label="Clipboard status" className="copy-status">
            {copying && 'Copy in progress. If you edit the request, copy it again when ready.'}
            {!blocked && copyState === 'done' && 'Copied. Paste it into your chat with the shop.'}
            {!blocked && copyState === 'failed' && 'Copy is unavailable here. Select the text below instead.'}
          </p>
          {!blocked && copyState === 'failed' && <textarea dir="auto" className="copy-fallback" aria-label="Request text" readOnly value={message} />}
        </>
      )}
    </dialog>
  );
}
