import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { type Product } from '../store/useCartStore';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { CartToast, useCartToast } from '../components/CartToast';

const Storefront = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, show } = useCartToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products?all=true');
        setProducts(data.products);
      } catch {
        setError('Unable to connect to the server. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(
    () => (Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]).slice(0, 6),
    [products]
  );
  const featured = products.slice(0, 8);

  return (
    <>
      <Header />
      <main className="page-container">
        {/* Hero */}
        <section className="hero-section animate-fade-up">
          <h1 className="hero-title">Next-Gen Electronics</h1>
          <p className="hero-subtitle">Discover premium gadgets with cash on delivery.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/products')}>
              Shop All Products <ArrowRight size={18} />
            </button>
          </div>
          <div className="carousel-banner">
            <img src="/gshock-banner.jpg" alt="G-SHOCK GA-2100-1A1 — Absolute Toughness" />
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">Shop by Category</h2>
            </div>
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="category-pill"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(cat)}`)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Featured products */}
        <div className="section-head">
          <h2 className="section-title">Featured Products</h2>
          {!loading && !error && products.length > 0 && (
            <button className="link-accent" onClick={() => navigate('/products')}>
              View all <ArrowRight size={16} />
            </button>
          )}
        </div>

        {loading && <div className="loading-spinner">Loading products…</div>}

        {error && !loading && (
          <div className="empty-state">
            <AlertCircle size={48} className="empty-state-icon" style={{ color: 'var(--danger)' }} />
            <p style={{ maxWidth: 400 }}>{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <Package size={64} className="empty-state-icon" />
            <h2>No Products Yet</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
              Products added via the admin dashboard will appear here.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/admin')}>Go to Admin</button>
          </div>
        )}

        {!loading && !error && featured.length > 0 && (
          <div className="product-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onAdded={show} />
            ))}
          </div>
        )}
      </main>
      <CartToast toast={toast} />
    </>
  );
};

export default Storefront;
