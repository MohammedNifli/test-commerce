import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { type Product } from '../store/useCartStore';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { CartToast, useCartToast } from '../components/CartToast';

const Products = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('featured');
  const { toast, show } = useCartToast();

  const q = params.get('q') || '';
  const category = params.get('category') || 'All';

  const patchParam = (key: string, value: string, keep: boolean) => {
    const next = new URLSearchParams(params);
    keep ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const setQ = (v: string) => patchParam('q', v, !!v);
  const setCategory = (v: string) => patchParam('category', v, !!v && v !== 'All');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products?all=true');
        setProducts(data.products);
      } catch {
        setError('Unable to load products. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(
    () => ['All', ...(Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[])],
    [products]
  );

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    let list = products.filter((p) => {
      const matchSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s) ||
        (p.category || '').toLowerCase().includes(s);
      const matchCat = category === 'All' || p.category === category;
      return matchSearch && matchCat;
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, q, category, sort]);

  const subtitle = loading
    ? 'Loading…'
    : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}${category !== 'All' ? ` in ${category}` : ''}`;

  return (
    <>
      <Header />
      <main className="page-container">
        <div className="page-head">
          <h1 className="page-title">All Products</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>

        <div className="products-toolbar">
          <div className="search-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="search"
              className="input-field"
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search products"
            />
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>

        {categories.length > 1 && (
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="loading-spinner">Loading products…</div>}

        {error && !loading && (
          <div className="empty-state">
            <AlertCircle size={48} className="empty-state-icon" style={{ color: 'var(--danger)' }} />
            <p style={{ maxWidth: 400 }}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" />
            <h2>No products found</h2>
            <button className="btn-secondary" onClick={() => { setQ(''); setCategory('All'); }}>
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="product-grid">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onAdded={show} />
            ))}
          </div>
        )}
      </main>
      <CartToast toast={toast} />
    </>
  );
};

export default Products;
