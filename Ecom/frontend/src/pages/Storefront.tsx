import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Heart, Package, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useCartStore, type Product } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { imgSrc } from '../config';

const Storefront = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState<{ name: string; visible: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const { items: wishlistItems, addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();
  const navigate = useNavigate();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ name: product.name, visible: true });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?all=true');
        setProducts(data.products);
      } catch (err) {
        setError('Unable to connect to the server. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return ['All', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="storefront-container">
      {/* ── Add-to-cart toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: '#18181b', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: '14px', padding: '1rem 1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '0.85rem',
          minWidth: '280px', maxWidth: '340px',
          animation: 'fadeInUp 0.3s ease forwards',
        }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={20} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#22c55e' }}>Added to cart</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.name}</div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.45rem 0.9rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
          >
            View Cart
          </button>
        </div>
      )}

      <header className="glass-panel sticky-header">
        <div className="header-content">
          <div className="logo animate-fade-up">
            <Package size={28} className="text-accent" />
            <span className="gradient-text">ElectroTech</span>
          </div>

          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <nav className="nav-actions">
            <button
              className="cart-btn"
              onClick={() => navigate('/wishlist')}
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
            >
              <Heart size={24} />
              {wishlistItems.length > 0 && <span className="cart-badge">{wishlistItems.length}</span>}
            </button>
            <button className="cart-btn" onClick={() => navigate('/cart')}>
              <ShoppingCart size={24} />
              {totalCartItems > 0 && <span className="cart-badge">{totalCartItems}</span>}
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section animate-fade-up">
          <h1 className="hero-title">Next-Gen Electronics</h1>
          <p className="hero-subtitle">Discover premium gadgets with cash on delivery.</p>
          <div className="carousel-banner">
            <img
              src="/gshock-banner.jpg"
              alt="G-SHOCK GA-2100-1A1 — Absolute Toughness"
            />
          </div>
        </section>

        {/* Category filter pills */}
        {!loading && !error && categories.length > 1 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  background: selectedCategory === cat ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                  color: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Loading products...
          </div>
        )}

        {error && !loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
            padding: '4rem', color: 'var(--danger)', textAlign: 'center',
          }}>
            <AlertCircle size={48} style={{ opacity: 0.7 }} />
            <p style={{ maxWidth: '400px' }}>{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state animate-fade-up">
            <Package size={64} className="empty-state-icon" />
            <h2>No Products Yet</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '360px', textAlign: 'center' }}>
              Products added via the admin dashboard will appear here.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/admin')}>Go to Admin</button>
          </div>
        )}

        {!loading && !error && products.length > 0 && filtered.length === 0 && (
          <div className="empty-state animate-fade-up">
            <Search size={48} className="empty-state-icon" />
            <h2>No results for "{search}"</h2>
            <button className="btn-secondary" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Showing {filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
            <div className="product-grid">
              {filtered.map((product, index) => {
                const inWishlist = isInWishlist(product.id);
                return (
                  <div
                    key={product.id}
                    className="product-card glass-panel animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s`, position: 'relative' }}
                  >
                    <button
                      className={`wishlist-toggle-icon ${inWishlist ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        inWishlist ? removeWishlist(product.id) : addWishlist(product);
                      }}
                    >
                      <Heart size={18} />
                    </button>

                    <div
                      className="product-image-container cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.imageUrl ? (
                        <img
                          src={imgSrc(product.imageUrl)}
                          alt={product.name}
                          className="product-image"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="product-image-placeholder"><Package size={48} /></div>
                      )}
                    </div>

                    <div className="product-info">
                      <span className="product-category">{product.category || 'General'}</span>
                      <h3
                        className="product-name cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <div
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            marginBottom: '0.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      )}
                      <div className="product-footer">
                        <span className="product-price">${product.price.toFixed(2)}</span>
                        <button
                          className="btn-primary add-to-cart-btn"
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Storefront;
