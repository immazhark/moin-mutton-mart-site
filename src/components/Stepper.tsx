import { Minus, Plus } from 'lucide-react';
import { formatQuantity, type Product } from '../lib/order/order';

interface Props {
  product: Product;
  quantity: number;
  onChange: (delta: -1 | 1) => void;
  canIncrease?: boolean;
}

export default function Stepper({ product, quantity, onChange, canIncrease = true }: Props) {
  return (
    <div className="stepper">
      <button type="button" aria-label={`Reduce ${product.name}`} onClick={() => onChange(-1)}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <output aria-live="polite">{formatQuantity(product, quantity)}</output>
      <button
        type="button"
        aria-label={`Increase ${product.name}`}
        disabled={!canIncrease || quantity + product.step > product.max}
        onClick={() => onChange(1)}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
