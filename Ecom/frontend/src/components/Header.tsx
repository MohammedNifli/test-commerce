import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Package, Search, Heart, ShoppingCart, Menu, X, User } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products', end: false },
  { to: '/wishlist', label: 'Wishlist', end: false },
];

/** Shared, fully responsive storefront header with mobile drawer. */
const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');

  const cartItems = useCartStore((s) => s.items);
  const wishlistItems = useWishlistStore((s) => s.items);
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu size={22} />
        </button>

        <div className="site-logo" onClick={() => navigate('/')}>
          <Package size={26} className="text-accent" />
          <span className="gradient-text">ElectroTech</span>
        </div>

        <nav className="site-nav">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form className="header-search" onSubmit={submitSearch} role="search">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            className="input-field"
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search products"
          />
        </form>

        <div className="header-actions">
          <button
            className="cart-btn"
            aria-label="Wishlist"
            onClick={() => navigate('/wishlist')}
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
          >
            <Heart size={22} />
            {wishlistItems.length > 0 && <span className="cart-badge">{wishlistItems.length}</span>}
          </button>
          <button className="cart-btn" aria-label="Cart" onClick={() => navigate('/cart')}>
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="cart-btn" aria-label="Profile" onClick={() => navigate('/profile')}>
            <User size={22} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div className="site-logo" onClick={() => { navigate('/'); setMenuOpen(false); }}>
                <Package size={22} className="text-accent" />
                <span className="gradient-text">ElectroTech</span>
              </div>
              <button className="cart-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="drawer-search" onSubmit={submitSearch} role="search">
              <Search size={18} className="search-icon" />
              <input
                type="search"
                className="input-field"
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search products"
              />
            </form>

            <nav className="drawer-nav">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}
                >
                  {l.label}
                </NavLink>
              ))}
              <NavLink to="/cart" onClick={() => setMenuOpen(false)} className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}>
                Cart
              </NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}>
                Profile
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
