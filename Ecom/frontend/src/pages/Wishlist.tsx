import { useNavigate } from 'react-router-dom';
import { Trash2, Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { imgSrc } from '../config';
import Header from '../components/Header';

const Wishlist = () => {
  const navigate = useNavigate();
  const { items, removeItem } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const moveToCart = (product: any) => {
    addItemToCart(product);
    removeItem(product.id);
  };

  return (
    <>
      <Header />
      <main className="page-container animate-fade-up">
        <div className="page-head">
          <h1 className="page-title">My Wishlist</h1>
          <p className="page-subtitle">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <Heart size={64} className="empty-state-icon" />
            <h2>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Save items you love to view them later.</p>
            <button className="btn-primary" onClick={() => navigate('/products')}>Browse Products</button>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((product) => (
              <div key={product.id} className="product-card glass-panel">
                <div className="product-image-container cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  {product.imageUrl ? (
                    <img src={imgSrc(product.imageUrl)} alt={product.name} className="product-image" loading="lazy" />
                  ) : (
                    <div className="product-image-placeholder">No Image</div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
                  <div className="product-price" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>${product.price.toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', marginTop: 'auto' }}>
                    <button
                      className="btn-primary"
                      onClick={(e) => { e.stopPropagation(); moveToCart(product); }}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart size={18} /> {product.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={(e) => { e.stopPropagation(); removeItem(product.id); }}
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                      <Trash2 size={18} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Wishlist;
