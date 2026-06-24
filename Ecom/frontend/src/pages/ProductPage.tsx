import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Heart, ShoppingCart, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useCartStore, type Product } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addedToCart, setAddedToCart] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const addItemToCart = useCartStore((state) => state.addItem);
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();

  const handleAddToCart = (p: Product) => {
    addItemToCart(p);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setAddedToCart(true);
    toastTimer.current = setTimeout(() => setAddedToCart(false), 3000);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Product not found.');
        } else {
          setError('Failed to load product. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state animate-fade-up" style={{ minHeight: '100vh' }}>
        <Package size={64} className="empty-state-icon" />
        <h2>{error || 'Product not found'}</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Store</button>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Back to Store
        </button>
      </div>

      <div className="product-details-container glass-panel animate-fade-up">
        <div className="product-details-image-wrapper">
          {product.imageUrl ? (
            <img
              src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`}
              alt={product.name}
              className="product-details-image"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="product-details-placeholder">
              <Package size={120} />
            </div>
          )}
        </div>

        <div className="product-details-info">
          <div className="product-details-category">{product.category || 'General'}</div>
          <h1 className="product-details-title gradient-text">{product.name}</h1>
          <div className="product-details-price">${product.price.toFixed(2)}</div>

          <div className={`product-details-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </div>

          {product.description && (
            <div
              className="product-details-desc"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <div className="product-actions-group">
            <button
              className="btn-primary"
              style={{ flex: 1, transition: 'all 0.2s' }}
              onClick={() => handleAddToCart(product)}
              disabled={product.stock === 0 || addedToCart}
            >
              {addedToCart ? (
                <><CheckCircle size={20} /> Added!</>
              ) : (
                <><ShoppingCart size={20} /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</>
              )}
            </button>

            <button
              className={`btn-wishlist ${inWishlist ? 'active' : ''}`}
              onClick={() => inWishlist ? removeWishlist(product.id) : addWishlist(product)}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart size={20} />
            </button>
          </div>

          {addedToCart && (
            <button
              onClick={() => navigate('/cart')}
              style={{
                width: '100%', marginTop: '0.75rem', padding: '0.75rem',
                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                border: '1.5px solid rgba(34,197,94,0.3)', borderRadius: '10px',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.5rem', animation: 'fadeInUp 0.3s ease forwards',
              }}
            >
              <ShoppingCart size={18} /> View Cart & Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
