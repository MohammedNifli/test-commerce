import { useNavigate } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { useCartStore, type Product } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { imgSrc } from '../config';

interface Props {
  product: Product;
  index?: number;
  onAdded?: (name: string) => void;
}

/** Shared product card used by the home and products pages. */
const ProductCard = ({ product, index = 0, onAdded }: Props) => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    onAdded?.(product.name);
  };

  return (
    <div
      className="product-card glass-panel animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s`, position: 'relative' }}
    >
      <button
        className={`wishlist-toggle-icon ${inWishlist ? 'active' : ''}`}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={(e) => {
          e.stopPropagation();
          inWishlist ? removeWishlist(product.id) : addWishlist(product);
        }}
      >
        <Heart size={18} />
      </button>

      <div className="product-image-container cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        {product.imageUrl ? (
          <img
            src={imgSrc(product.imageUrl)}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="product-image-placeholder"><Package size={48} /></div>
        )}
      </div>

      <div className="product-info">
        <span className="product-category">{product.category || 'General'}</span>
        <h3 className="product-name cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
          {product.name}
        </h3>
        {product.description && (
          <div className="product-desc-clamp" dangerouslySetInnerHTML={{ __html: product.description }} />
        )}
        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button
            className="btn-primary add-to-cart-btn"
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
