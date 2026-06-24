import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';

const Wishlist = () => {
  const navigate = useNavigate();
  const { items, removeItem } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const moveToCart = (product: any) => {
    addItemToCart(product);
    removeItem(product.id);
  };

  return (
    <div className="checkout-container animate-fade-up">
      <header className="checkout-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Back to Store
        </button>
        <h1>My Wishlist</h1>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', minHeight: '60vh' }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <Heart size={64} className="empty-state-icon" />
            <h2>Your wishlist is empty</h2>
            <p>Save items you love to view them later.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Browse Products</button>
          </div>
        ) : (
          <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {items.map((product) => (
              <div key={product.id} className="product-card glass-panel" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="product-image-container cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  {product.imageUrl ? (
                    <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">No Image</div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>${product.price.toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
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
      </div>
    </div>
  );
};

export default Wishlist;
