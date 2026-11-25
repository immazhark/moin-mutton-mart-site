import { Search, ShoppingBasket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { categories, products } from '../data/products';
import type { Selection } from '../lib/order/order';
import { STORAGE_KEY, decodeDraft, encodeDraft } from '../lib/order/storage';
import ProductCard from './ProductCard';
import ReviewSheet from './ReviewSheet';

export default function Catalogue() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Selection[]>([]);
  const [restored, setRestored] = useState(false);
  const startedAt = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  // Restore once. Storage can be denied or corrupt; the basket then simply starts empty.
  useEffect(() => {
    try {
      const draft = decodeDraft(localStorage.getItem(STORAGE_KEY), products);
      if (draft) {
        startedAt.current = draft.startedAt;
        setItems(draft.items);
      }
    } catch {
      /* continue in memory */
    }
    setRestored(true);
  }, []);

  // Persist without moving the retention clock: it starts with the first item only.
  useEffect(() => {
    if (!restored) return;
    try {
      if (items.length === 0) {
        startedAt.current = 0;
        localStorage.removeItem(STORAGE_KEY);
      } else {
        startedAt.current ||= Date.now();
        localStorage.setItem(STORAGE_KEY, encodeDraft(items, startedAt.current));
      }
    } catch {
      /* no persistence available */
    }
  }, [items, restored]);

  function change(id: string, delta: -1 | 1) {
    const p = products.find((x) => x.id === id)!;
    setItems((prev) => {
      const old = prev.find((s) => s.productId === id);
      const quantity = (old?.quantity ?? 0) + delta * p.step;
      if (quantity <= 0) return prev.filter((s) => s.productId !== id);
      if (quantity > p.max) return prev;
      return old ? prev.map((s) => (s.productId === id ? { ...s, quantity } : s)) : [...prev, { productId: id, quantity, note: '' }];
    });
  }

  // Sheet: Back closes it instead of leaving the page, and the page behind does not scroll.
  function openSheet() {
    history.pushState({ sheet: true }, '');
    document.body.classList.add('sheet-open');
    dialog.current?.showModal();
  }
  function onSheetClosed() {
    document.body.classList.remove('sheet-open');
    if (history.state?.sheet) history.back();
    opener.current?.focus();
  }
  useEffect(() => {
    const onPop = () => dialog.current?.open && dialog.current.close();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const q = query.trim().toLowerCase();
  const visible = products.filter(
    (p) => (category === 'All' || p.category === category) && (!q || p.name.toLowerCase().includes(q)),
  );
  const count = items.length;

  return (
    <section id="catalogue" className="catalogue" aria-labelledby="shop-title">
      <div className="shop-head">
        <h1 id="shop-title">Choose your cuts</h1>
        <p className="status">Rates confirmed by the shop</p>
      </div>

      <label className="search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search the range</span>
        <input type="search" placeholder="Search the range" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      <div className="categories" role="group" aria-label="Categories">
        {categories.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} quantity={items.find((s) => s.productId === p.id)?.quantity} onChange={change} />
          ))}
        </div>
      ) : (
        <p className="no-results">Nothing in the range matches “{query}”. Try another word or call the shop.</p>
      )}

      {count > 0 && (
        <div className="basket-bar">
          <ShoppingBasket size={22} aria-hidden="true" />
          <span>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
          <button ref={opener} type="button" onClick={openSheet}>
            Review request
          </button>
        </div>
      )}

      <ReviewSheet
        dialogRef={dialog}
        products={products}
        items={items}
        onChange={change}
        onRemove={(id) => setItems((prev) => prev.filter((s) => s.productId !== id))}
        onNote={(id, note) => setItems((prev) => prev.map((s) => (s.productId === id ? { ...s, note } : s)))}
        onClose={onSheetClosed}
      />
    </section>
  );
}
