import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { imgSrc as getImageSrc } from '../config';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div className="empty-state animate-fade-up">
          <ShoppingCart size={72} className="empty-state-icon" />
          <h2>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', textAlign: 'center' }}>
            Add some products from the store to get started.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} /> Back to Store
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Your Cart <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
          </h1>
        </div>
        <button
          className="btn-danger"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          onClick={clearCart}
        >
          Clear All
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel animate-fade-up"
              style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', alignItems: 'center' }}
            >
              {/* Image */}
              <div
                style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                {item.imageUrl ? (
                  <img
                    src={getImageSrc(item.imageUrl)}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Package size={32} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  {item.category || 'General'}
                </div>
                <h3
                  style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  {item.name}
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  ${item.price.toFixed(2)} each
                </div>
              </div>

              {/* Quantity controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', opacity: item.quantity >= item.stock ? 0.4 : 1, transition: 'background 0.2s' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Line total */}
              <div style={{ minWidth: '80px', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id)}
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'sticky', top: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Order Summary</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>
                  {item.name} × {item.quantity}
                </span>
                <span style={{ flexShrink: 0, color: 'var(--text-primary)' }}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span>Shipping</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800, marginTop: '0.75rem' }}>
              <span>Total</span>
              <span className="gradient-text">${getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* COD badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💵</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>Cash on Delivery</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pay when your order arrives</div>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
