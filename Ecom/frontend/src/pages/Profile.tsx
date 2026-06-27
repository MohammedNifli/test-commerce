import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Phone, Mail, LogOut } from 'lucide-react';
import api from '../api/axios';
import Header from '../components/Header';
import { useProfileStore } from '../store/useProfileStore';
import { imgSrc } from '../config';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  PENDING:    { color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  PROCESSING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  SHIPPED:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  DELIVERED:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  CANCELLED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const Profile = () => {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const clearProfile = useProfileStore((s) => s.clearProfile);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!profile?.customerEmail);
  const [error, setError] = useState('');

  // Auto-load the order history for the email saved at checkout.
  useEffect(() => {
    const email = profile?.customerEmail;
    if (!email) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/orders/my?email=${encodeURIComponent(email)}`);
        setOrders(data);
      } catch {
        setError('Could not load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.customerEmail]);

  return (
    <>
      <Header />
      <main className="page-container">
        <div className="page-head">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your details and order history</p>
        </div>

        {profile && (
          <div className="glass-panel profile-card">
            <div className="profile-avatar"><User size={30} /></div>
            <div className="profile-fields">
              <div className="profile-name">{profile.customerName}</div>
              <div className="profile-meta"><Mail size={14} /> {profile.customerEmail}</div>
              <div className="profile-meta"><Phone size={14} /> {profile.customerPhone}</div>
              <div className="profile-meta">
                <MapPin size={14} /> {profile.address}, {profile.city} {profile.postalCode}, {profile.country}
              </div>
            </div>
            <button className="btn-secondary profile-signout" onClick={clearProfile}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}

        <div className="section-head">
          <h2 className="section-title">Order History</h2>
          {!loading && orders.length > 0 && (
            <span className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading && <div className="loading-spinner">Loading your orders…</div>}

        {error && !loading && (
          <div className="empty-state">
            <Package size={48} className="empty-state-icon" style={{ color: 'var(--danger)' }} />
            <p style={{ maxWidth: 400 }}>{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <Package size={56} className="empty-state-icon" />
            <h2>No orders yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your orders will appear here after you place one.</p>
            <button className="btn-primary" onClick={() => navigate('/products')}>Start shopping</button>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((o) => {
              const cfg = STATUS_COLORS[o.status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
              return (
                <div key={o.id} className="glass-panel order-card">
                  <div className="order-card-head">
                    <div>
                      <div className="order-id">#{o.id.substring(0, 8).toUpperCase()}</div>
                      <div className="order-date">
                        {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <span className="order-status" style={{ color: cfg.color, background: cfg.bg }}>{o.status}</span>
                  </div>

                  <div className="order-items">
                    {o.items?.map((it: any) => (
                      <div key={it.id} className="order-item-row">
                        <div className="order-thumb">
                          {it.product?.imageUrl ? (
                            <img src={imgSrc(it.product.imageUrl)} alt={it.product?.name} loading="lazy" />
                          ) : (
                            <Package size={18} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                          )}
                        </div>
                        <span className="order-item-name">{it.product?.name ?? 'Product'}</span>
                        <span className="order-item-qty">×{it.quantity}</span>
                        <span className="order-item-price">${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-foot">
                    <span style={{ color: 'var(--text-secondary)' }}>Total ({o.paymentMethod})</span>
                    <span className="gradient-text" style={{ fontWeight: 800 }}>${o.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
};

export default Profile;
