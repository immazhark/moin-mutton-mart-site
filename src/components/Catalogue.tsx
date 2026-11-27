import { Search, ShoppingBasket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { categories, products } from '../data/products';
import type { Selection } from '../lib/order/order';
import { RETENTION_MS, STORAGE_KEY, decodeDraft, encodeDraft } from '../lib/order/storage';
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
  const searchInput = useRef<HTMLInputElement>(null);
  const closing = useRef(false);
  const historyInitialized = useRef(false);

  // Restore once. Storage can be denied or corrupt; the basket then simply starts empty.
  useEffect(() => {
    try {
      const draft = decodeDraft(localStorage.getItem(STORAGE_KEY), products);
      if (draft) {
        startedAt.current = draft.startedAt;
        setItems(draft.items);
      } else {
        localStorage.removeItem(STORAGE_KEY);
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
        if (Date.now() - startedAt.current > RETENTION_MS) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, encodeDraft(items, startedAt.current));
      }
    } catch {
      /* no persistence available */
    }
  }, [items, restored]);

  function change(id: string, delta: -1 | 1) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setItems((prev) => {
      const old = prev.find((s) => s.productId === id);
      const quantity = (old?.quantity ?? 0) + delta * p.step;
      if (quantity <= 0) return prev.filter((s) => s.productId !== id);
      if (quantity > p.max) return prev;
      return old ? prev.map((s) => (s.productId === id ? { ...s, quantity } : s)) : [...prev, { productId: id, quantity, note: '' }];
    });
  }

  // Only a namespaced history entry represents an open sheet. Back and Forward
  // synchronize the dialog; a delayed native close event must never navigate again.
  function openSheet() {
    const element = dialog.current;
    if (!element || element.open || closing.current || items.length === 0) return;
    element.showModal();
    document.body.classList.add('sheet-open');
    try {
      if (!history.state?.moinReview) history.pushState({ ...history.state, moinReview: true }, '');
    } catch {
      // Navigation history can be throttled; the explicit close button still works.
    }
  }
  function requestClose() {
    if (!dialog.current?.open || closing.current) return;
    if (history.state?.moinReview) {
      closing.current = true;
      history.back();
    } else {
      dialog.current.close();
      document.body.classList.remove('sheet-open');
    }
  }
  function onSheetClosed() {
    if (dialog.current?.open) return; // stale close event after a rapid Forward/reopen
    document.body.classList.remove('sheet-open');
    (opener.current ?? searchInput.current)?.focus();
  }
  useEffect(() => {
    if (!restored) return;
    const synchronize = () => {
      closing.current = false;
      const element = dialog.current;
      if (!element) return;
      if (history.state?.moinReview && items.length > 0) {
        if (!element.open) element.showModal();
        document.body.classList.add('sheet-open');
      } else {
        if (element.open) element.close();
        document.body.classList.remove('sheet-open');
        if (history.state?.moinReview) {
          const { moinReview: _marker, ...state } = history.state;
          history.replaceState(state, '');
        }
      }
    };
    // On reload, a saved basket can restore a history-marked review entry.
    // Removing the final item while reviewing must leave the empty sheet usable.
    if (!historyInitialized.current) {
      historyInitialized.current = true;
      synchronize();
    }
    window.addEventListener('popstate', synchronize);
    return () => window.removeEventListener('popstate', synchronize);
  }, [restored, items.length]);
  useEffect(() => () => {
    document.body.classList.remove('sheet-open');
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
        <input ref={searchInput} type="search" placeholder="Search the range" value={query} onChange={(e) => setQuery(e.target.value)} />
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
        onRequestClose={requestClose}
      />
    </section>
  );
}
