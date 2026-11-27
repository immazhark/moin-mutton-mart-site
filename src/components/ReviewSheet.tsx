import { Check, Copy, MessageCircle, Phone, Trash2, X } from 'lucide-react';
import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react';
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

const FULFILMENT_OPTIONS: { value: Fulfilment; label: string }[] = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'discuss', label: 'Not sure yet' },
];

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  products: readonly Product[];
  items: Selection[];
  onChange: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onClose: () => void;
  onRequestClose: () => void;
}

export default function ReviewSheet({ dialogRef, products, items, onChange, onRemove, onNote, onClose, onRequestClose }: Props) {
  const [fulfilment, setFulfilment] = useState<Fulfilment>('discuss');
  const [orderNote, setOrderNote] = useState('');
  const [copySession] = useState(() => new CopySession());
  const { busy: copying, result: copyState } = useSyncExternalStore(copySession.subscribe, copySession.getSnapshot, copySession.getSnapshot);
  const [otherOpen, setOtherOpen] = useState<Set<string>>(new Set());

  const message = items.length ? formatRequest(products, items, fulfilment, orderNote) : '';
  const canLink = message !== '' && linkFits(message);

  useLayoutEffect(() => { copySession.setMessage(message); }, [copySession, message]);

  function copy() {
    void copySession.copy((text) => navigator.clipboard.writeText(text));
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
              const chips = p.cuts ?? [];
              const showOther = chips.length === 0 || otherOpen.has(p.id) || (s.note !== '' && !chips.includes(s.note));
              return (
                <li key={p.id} className="line">
                  <div className="line-top">
                    <h3>{p.name}</h3>
                    <button type="button" className="link-btn" aria-label={`Remove ${p.name}`} onClick={() => onRemove(p.id)}>
                      <Trash2 size={16} aria-hidden="true" /> Remove
                    </button>
                  </div>
                  <Stepper product={p} quantity={s.quantity} onChange={(d) => onChange(p.id, d)} />
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
                      <input maxLength={MAX_LINE_NOTE} value={s.note} onChange={(e) => onNote(p.id, e.target.value)} />
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
              <textarea maxLength={MAX_ORDER_NOTE} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
            </label>
          </details>

          <p className="qualify">
            No payment here. Rates, availability and final weight are confirmed by the shop.
          </p>

          {canLink ? (
            <a className="btn-primary whatsapp" href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={20} aria-hidden="true" /> Continue on WhatsApp
            </a>
          ) : (
            <p className="qualify" role="alert">
              This request is too long for a WhatsApp link. Copy it and paste it into WhatsApp, or call the shop.
            </p>
          )}
          <p className="destination">Opens a chat with +91 81437 30054. You send the message yourself.</p>

          <div className="fallbacks">
            <button type="button" className="btn-secondary" onClick={copy} disabled={copying}>
              {copyState === 'done' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} {copying ? 'Copying…' : 'Copy request'}
            </button>
            <a className="btn-secondary" href="tel:+918143730054">
              <Phone size={18} aria-hidden="true" /> Call instead
            </a>
          </div>
          <p role="status" aria-label="Clipboard status" className="copy-status">
            {copying && 'Copy in progress. If you edit the request, copy it again when ready.'}
            {copyState === 'done' && 'Copied. Paste it into your chat with the shop.'}
            {copyState === 'failed' && 'Copy is unavailable here. Select the text below instead.'}
          </p>
          {copyState === 'failed' && <textarea className="copy-fallback" aria-label="Request text" readOnly value={message} />}
        </>
      )}
    </dialog>
  );
}
