import { Beef, Drumstick, Plus } from 'lucide-react';
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
}

export default function ProductCard({ product: p, quantity, onChange }: Props) {
  const Icon = p.category === 'Chicken' ? Drumstick : Beef;
  return (
    <article className="product-card" data-category={p.category}>
      {/* Illustrative stand-in until the shop's own photographs are supplied. */}
      <div className="product-photo" role="img" aria-label={`${p.name}: photograph to come`}>
        <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
        <span>Photo to come</span>
      </div>
      <div className="product-body">
        <h3>{p.name}</h3>
        <p className="unit-hint">{unitHint(p)}</p>
        <p className="rate">Ask for today’s rate</p>
        {quantity ? (
          <Stepper product={p} quantity={quantity} onChange={(d) => onChange(p.id, d)} />
        ) : (
          <button type="button" className="add" aria-label={`Add ${p.name}`} onClick={() => onChange(p.id, 1)}>
            <Plus size={18} aria-hidden="true" /> Add
          </button>
        )}
      </div>
    </article>
  );
}
