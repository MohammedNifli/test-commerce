import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, Truck, MapPin, User, Phone, Mail } from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/useCartStore';
import { useProfileStore } from '../store/useProfileStore';
import { imgSrc as getImageSrc } from '../config';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const setProfile = useProfileStore((s) => s.setProfile);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        ...form,
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
      });
      setProfile(form); // remember details for the Profile page / order history
      clearCart();
      setOrderId(data.order?.id || '');
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel animate-fade-up" style={{ maxWidth: '480px', width: '100%', padding: '3rem 2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={44} style={{ color: 'var(--success)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Order Confirmed!</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your Cash on Delivery order has been placed successfully. Our team will contact you to confirm delivery.
          </p>
          {orderId && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Order ID: <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{orderId.substring(0, 8).toUpperCase()}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
            <Truck size={18} /> Pay on delivery — no upfront payment required
          </div>
          <button className="btn-primary" style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state animate-fade-up">
          <Package size={64} className="empty-state-icon" />
          <h2>Your cart is empty</h2>
          <button className="btn-primary" onClick={() => navigate('/')}>Go Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <button className="back-btn" onClick={() => navigate('/cart')}>
          <ArrowLeft size={20} /> Back to Cart
        </button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Checkout</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        {/* Shipping Form */}
        <form onSubmit={handleSubmit}>
          {/* COD Banner */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderColor: 'rgba(34,197,94,0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={22} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>Cash on Delivery</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>You pay when your order is delivered to your door. No card required.</div>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(34,197,94,0.12)', color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '999px', flexShrink: 0 }}>
              COD Only
            </div>
          </div>

          {/* Personal Details */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <User size={16} /> Personal Details
            </h2>
            <div className="form-group">
              <label>Full Name</label>
              <input required type="text" className="input-field" placeholder="John Doe" value={form.customerName} onChange={set('customerName')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><Mail size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Email</label>
                <input required type="email" className="input-field" placeholder="john@example.com" value={form.customerEmail} onChange={set('customerEmail')} />
              </div>
              <div className="form-group">
                <label><Phone size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Phone</label>
                <input required type="tel" className="input-field" placeholder="+1 555 000 0000" value={form.customerPhone} onChange={set('customerPhone')} />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <MapPin size={16} /> Delivery Address
            </h2>
            <div className="form-group">
              <label>Street Address</label>
              <input required type="text" className="input-field" placeholder="123 Main Street, Apt 4B" value={form.address} onChange={set('address')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input required type="text" className="input-field" placeholder="New York" value={form.city} onChange={set('city')} />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input required type="text" className="input-field" placeholder="10001" value={form.postalCode} onChange={set('postalCode')} />
              </div>
            </div>
            <div className="form-group">
              <label>Country</label>
              <input required type="text" className="input-field" placeholder="United States" value={form.country} onChange={set('country')} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.9rem 1.25rem', color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Placing Order...' : `Place COD Order • $${getTotal().toFixed(2)}`}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Order Summary ({items.length} item{items.length !== 1 ? 's' : ''})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl ? (
                      <img
                        src={getImageSrc(item.imageUrl)}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Package size={20} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                <span>Subtotal</span><span>${getTotal().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                <span>Shipping</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>Total</span>
                <span className="gradient-text">${getTotal().toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
              💵 <strong style={{ color: 'var(--success)' }}>Cash on Delivery</strong><br />
              No payment needed until delivery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
