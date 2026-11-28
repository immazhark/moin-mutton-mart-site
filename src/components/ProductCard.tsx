import { Beef, Drumstick, Plus } from 'lucide-react';
import {useLayoutEffect,useRef} from 'react';
import type { Product } from '../lib/order/order';
import Stepper from './Stepper';

function unitHint(p: Product): string {
  if (p.unit === 'g') return `By weight · from ${p.step >= 1000 ? `${p.step / 1000} kg` : `${p.step} g`}`;
  if (p.unit === 'set') return p.setContents ? `Per set · ${p.setContents}` : 'Per set';
  return 'Per piece';
}

interface Props {
  product: Product;
  quantity: number | undefined;
  onChange: (id: string, delta: -1 | 1) => void;
  canIncrease: boolean;
  rateText: string;
  availabilityText: string;
}

export default function ProductCard({ product: p, quantity, onChange, canIncrease, rateText, availabilityText }: Props) {
  const Icon = p.category === 'Chicken' ? Drumstick : Beef;
  const root=useRef<HTMLElement>(null);
  const focusAfterChange=useRef(false);
  function change(delta:-1|1){
    focusAfterChange.current=!!root.current?.contains(document.activeElement);
    onChange(p.id,delta);
  }
  useLayoutEffect(()=>{
    if(!focusAfterChange.current)return;
    focusAfterChange.current=false;
    const node=root.current;
    if(!node||node.contains(document.activeElement))return;
    const next=node.querySelector<HTMLButtonElement>('.stepper button:last-child:not(:disabled), .add:not(:disabled)')??node.querySelector<HTMLButtonElement>('.stepper button:not(:disabled)');
    next?.focus();
  },[quantity]);
  return (
    <article ref={root} className="product-card" data-category={p.category}>
      {/* Illustrative stand-in until the shop's own photographs are supplied. */}
      <div className="product-photo" role="img" aria-label={`${p.name}: photograph to come`}>
        <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
        <span>Photo to come</span>
      </div>
      <div className="product-body">
        <h2>{p.name}</h2>
        <p className="unit-hint">{unitHint(p)}</p>
        <p className="rate">{rateText}</p><p className="unit-hint">{availabilityText}</p>
        {quantity ? (
          <Stepper product={p} quantity={quantity} canIncrease={canIncrease} onChange={change} />
        ) : (
          <button type="button" className="add" aria-label={`Add ${p.name}`} disabled={!canIncrease} onClick={() => change(1)}>
            <Plus size={18} aria-hidden="true" /> Add
          </button>
        )}
      </div>
    </article>
  );
}
