import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, ShoppingBag, Upload, LogOut, Plus, Edit, Trash2,
  CheckCircle, XCircle, FileText, ChevronDown, ChevronUp, Loader, AlertTriangle,
} from 'lucide-react';
import api from '../api/axios';
import { imgSrc as getImgSrc } from '../config';

interface UploadResult {
  message: string;
  inserted: number;
  errorCount: number;
  errors: string[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:    { color: '#eab308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.35)' },
  PROCESSING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
  SHIPPED:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)' },
  DELIVERED:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)' },
  CANCELLED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)' },
};


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders]     = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk upload
  const [uploading, setUploading]       = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError]   = useState('');

  // Add product
  const [showAddModal, setShowAddModal]     = useState(false);
  const [newProduct, setNewProduct]         = useState({ name: '', category: '', price: '', stock: '', description: '' });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);

  // Edit product
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [editImage, setEditImage]     = useState<File | null>(null);
  const [saving, setSaving]           = useState(false);

  // Delete product
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);

  // Bulk delete
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting]       = useState(false);

  // Orders
  const [expandedOrder, setExpandedOrder]   = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId]           = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login'); return; }
    setSelectedIds(new Set());
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'products') {
        const { data } = await api.get('/products?all=true');
        setProducts(data.products);
      } else if (activeTab === 'orders') {
        const { data } = await api.get('/orders');
        setOrders(data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/admin/login');
    }
  };

  // ── Product handlers ────────────────────────────────────────────────────────

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', newProduct.name);
    fd.append('category', newProduct.category);
    fd.append('price', newProduct.price);
    fd.append('stock', newProduct.stock);
    fd.append('description', newProduct.description);
    if (newProductImage) fd.append('image', newProductImage);
    try {
      await api.post('/products', fd);
      setShowAddModal(false);
      setNewProduct({ name: '', category: '', price: '', stock: '', description: '' });
      setNewProductImage(null);
      fetchData();
    } catch {
      alert('Failed to add product');
    }
  };

  const openEdit = (p: any) => {
    setEditProduct({ ...p, price: String(p.price), stock: String(p.stock) });
    setEditImage(null);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('name', editProduct.name);
    fd.append('category', editProduct.category ?? '');
    fd.append('price', editProduct.price);
    fd.append('stock', editProduct.stock);
    fd.append('description', editProduct.description ?? '');
    if (editImage) fd.append('image', editImage);
    try {
      await api.put(`/products/${editProduct.id}`, fd);
      setProducts(prev =>
        prev.map(p =>
          p.id === editProduct.id
            ? { ...p, name: editProduct.name, category: editProduct.category, price: parseFloat(editProduct.price), stock: parseInt(editProduct.stock), description: editProduct.description }
            : p
        )
      );
      setEditProduct(null);
      setEditImage(null);
    } catch {
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await api.delete(`/products/${confirmDeleteId}`);
      setProducts(prev => prev.filter(p => p.id !== confirmDeleteId));
      setSelectedIds(prev => {
        if (!prev.has(confirmDeleteId)) return prev;
        const next = new Set(prev);
        next.delete(confirmDeleteId);
        return next;
      });
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = products.length > 0 && selectedIds.size === products.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(products.map(p => p.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = [...selectedIds];
    try {
      const { data } = await api.post('/products/bulk-delete', { ids });
      const deletedSet = new Set(ids.filter(id => !(data.skippedIds ?? []).includes(id)));
      setProducts(prev => prev.filter(p => !deletedSet.has(p.id)));
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
      if (data.skipped > 0) {
        alert(`${data.deleted} deleted. ${data.skipped} could not be deleted because they belong to existing orders.`);
      }
    } catch {
      alert('Failed to delete products');
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── Order handlers ───────────────────────────────────────────────────────────

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingStatus(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {
      // silent
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirmDeleteOrderId) return;
    setDeletingOrderId(confirmDeleteOrderId);
    try {
      await api.delete(`/orders/${confirmDeleteOrderId}`);
      setOrders(prev => prev.filter(o => o.id !== confirmDeleteOrderId));
      setConfirmDeleteOrderId(null);
    } catch {
      alert('Failed to delete order');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // ── Bulk upload helpers ──────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/products/bulk-upload', fd);
      setUploadResult(data as UploadResult);
      const { data: pd } = await api.get('/products?all=true');
      setProducts(pd.products);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,price,stock,category,description,imageUrl\nExample Product,29.99,100,Electronics,A great product,\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'products_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // ── Shared modal styles ──────────────────────────────────────────────────────

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  };
  const modalBox: React.CSSProperties = {
    width: '100%', maxWidth: '520px', padding: '2rem',
    borderRadius: '16px', background: '#18181b',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc',
    padding: '0.7rem 1rem', borderRadius: '10px',
    fontFamily: 'inherit', fontSize: '0.9rem', marginTop: '0.4rem', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar glass-panel">
        <div className="sidebar-header">
          <h2 className="gradient-text">Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'products', icon: <Package size={20} />, label: 'Products' },
            { id: 'orders',   icon: <ShoppingBag size={20} />, label: 'Orders' },
            { id: 'upload',   icon: <Upload size={20} />, label: 'Bulk Upload' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="admin-main">

        {/* ── Products Tab ── */}
        {activeTab === 'products' && (
          <div className="admin-section animate-fade-up">
            <div className="section-header">
              <div>
                <h2>Product Management</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : `${products.length} product${products.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setConfirmBulkDelete(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '0.6rem 1.1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}
                  >
                    <Trash2 size={16} /> Delete Selected ({selectedIds.size})
                  </button>
                )}
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                  <Plus size={18} /> Add Product
                </button>
              </div>
            </div>

            <div className="table-container glass-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        title={allSelected ? 'Deselect all' : 'Select all'}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
                      />
                    </th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={selectedIds.has(p.id) ? { background: 'rgba(99,102,241,0.08)' } : undefined}>
                      {/* Select */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
                        />
                      </td>
                      {/* Thumbnail */}
                      <td>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.imageUrl ? (
                            <img
                              src={getImgSrc(p.imageUrl)}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Package size={20} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: '220px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {p.description.replace(/<[^>]*>/g, '')}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.category || '—'}</td>
                      <td style={{ fontWeight: 700 }}>${p.price.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${p.stock > 0 ? 'success' : 'danger'}`}>
                          {p.stock > 0 ? p.stock : 'Out'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            className="icon-btn"
                            title="Edit product"
                            onClick={() => openEdit(p)}
                            style={{ color: '#3b82f6' }}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="icon-btn"
                            title="Delete product"
                            onClick={() => setConfirmDeleteId(p.id)}
                            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Orders Tab ── */}
        {activeTab === 'orders' && (
          <div className="admin-section animate-fade-up">
            <div className="section-header">
              <h2>Order Management</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state glass-panel" style={{ padding: '4rem' }}>
                <ShoppingBag size={56} className="empty-state-icon" />
                <h3>No orders yet</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Orders placed from the storefront will appear here.</p>
              </div>
            ) : (
              <div className="table-container glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const isExpanded = expandedOrder === o.id;
                      const isUpdating = updatingStatus === o.id;
                      const cfg = STATUS_CONFIG[o.status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' };
                      return (
                        <Fragment key={o.id}>
                          <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedOrder(isExpanded ? null : o.id)}>
                            <td>
                              <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                #{o.id.substring(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{o.customerEmail}</div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                              {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td>
                              <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                {o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>${o.totalAmount.toFixed(2)}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                  <select
                                    value={o.status}
                                    disabled={isUpdating}
                                    onChange={e => handleStatusUpdate(o.id, e.target.value)}
                                    style={{
                                      appearance: 'none', WebkitAppearance: 'none',
                                      background: cfg.bg, color: cfg.color,
                                      border: `1.5px solid ${cfg.border}`,
                                      borderRadius: '999px', padding: '0.35rem 2rem 0.35rem 0.85rem',
                                      fontWeight: 700, fontSize: '0.78rem', fontFamily: 'inherit',
                                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                                      outline: 'none', opacity: isUpdating ? 0.6 : 1, transition: 'all 0.2s',
                                    }}
                                  >
                                    {['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                                      <option key={s} value={s} style={{ background: '#1a1a1f', color: '#f8fafc', fontWeight: 600 }}>{s}</option>
                                    ))}
                                  </select>
                                  <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: cfg.color, fontSize: '0.6rem' }}>▼</span>
                                </div>
                                {isUpdating && <Loader size={14} style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />}
                              </div>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="icon-btn"
                                  title="Delete order"
                                  onClick={() => setConfirmDeleteOrderId(o.id)}
                                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                                <button
                                  className="icon-btn"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                  onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                                  style={{ background: 'transparent' }}
                                >
                                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
                              <td colSpan={7} style={{ padding: 0 }}>
                                <div style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Delivery Details</div>
                                    <div style={{ fontSize: '0.88rem', lineHeight: 2, color: 'var(--text-secondary)' }}>
                                      <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{o.customerName}</div>
                                      <div>{o.customerPhone}</div>
                                      <div>{o.address}</div>
                                      <div>{o.city}, {o.postalCode}</div>
                                      <div>{o.country}</div>
                                      <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.82rem', marginTop: '0.25rem' }}>💵 Cash on Delivery</div>
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Items Ordered</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                      {o.items?.map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              {item.product?.imageUrl ? (
                                                <img src={getImgSrc(item.product.imageUrl)} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                              ) : (
                                                <Package size={16} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                              )}
                                            </div>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.product?.name ?? 'Unknown product'}</span>
                                          </div>
                                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                                            ×{item.quantity} <strong style={{ color: 'var(--text-primary)' }}>${(item.price * item.quantity).toFixed(2)}</strong>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Order Total</span>
                                      <span className="gradient-text">${o.totalAmount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Bulk Upload Tab ── */}
        {activeTab === 'upload' && (
          <div className="admin-section animate-fade-up">
            <div className="section-header"><h2>Bulk Product Upload</h2></div>
            <div className="upload-container glass-panel">
              <Upload size={48} className="text-secondary mb-4" />
              <h3>Upload Products File</h3>
              <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>Supported formats: <strong>CSV</strong>, <strong>Excel (.xlsx / .xls)</strong></p>
              <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Required: <code>name</code>, <code>price</code> &nbsp;|&nbsp; Optional: <code>stock</code>, <code>category</code>, <code>description</code>, <code>imageUrl</code>
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden-input" id="bulk-upload" disabled={uploading} />
                <label htmlFor="bulk-upload" className="btn-primary cursor-pointer" style={{ opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto' }}>
                  {uploading ? 'Uploading...' : 'Select File'}
                </label>
                <button className="btn-secondary" onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> Download Template
                </button>
              </div>
              {uploading && <div className="mt-4" style={{ color: 'var(--text-secondary)' }}>Processing file, please wait...</div>}
              {uploadResult && !uploading && (
                <div className="mt-4" style={{ textAlign: 'left', width: '100%', maxWidth: '500px', margin: '1.5rem auto 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <CheckCircle size={20} color="#22c55e" />
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{uploadResult.inserted} product{uploadResult.inserted !== 1 ? 's' : ''} inserted successfully</span>
                  </div>
                  {uploadResult.errorCount > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <XCircle size={18} color="#ef4444" />
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{uploadResult.errorCount} row{uploadResult.errorCount !== 1 ? 's' : ''} skipped</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
                        {uploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                  <button className="btn-primary" onClick={() => setActiveTab('products')} style={{ marginTop: '1rem' }}>View Products</button>
                </div>
              )}
              {uploadError && !uploading && (
                <div className="mt-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                  <XCircle size={18} /> {uploadError}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Add Product Modal ── */}
      {showAddModal && (
        <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add New Product</h2>
              <button className="icon-btn" onClick={() => setShowAddModal(false)} style={{ fontSize: '1.2rem', width: '32px', height: '32px' }}>×</button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={inputStyle} placeholder="Product name" />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input type="text" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={inputStyle} placeholder="e.g. Electronics" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Price *</label>
                  <input required type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={inputStyle} placeholder="0.00" />
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input required type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Optional description" />
              </div>
              <div>
                <label style={labelStyle}>Product Image</label>
                <input type="file" accept="image/*" onChange={e => setNewProductImage(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ── */}
      {editProduct && (
        <div style={modalOverlay} onClick={() => setEditProduct(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Product</h2>
              <button className="icon-btn" onClick={() => setEditProduct(null)} style={{ fontSize: '1.2rem', width: '32px', height: '32px' }}>×</button>
            </div>

            {/* Current image preview */}
            {editProduct.imageUrl && !editImage && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={getImgSrc(editProduct.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Current image — upload a new one to replace it</span>
              </div>
            )}
            {editImage && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={URL.createObjectURL(editImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--success)' }}>New image selected</span>
              </div>
            )}

            <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input required type="text" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input type="text" value={editProduct.category ?? ''} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Price *</label>
                  <input required type="number" step="0.01" min="0" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input required type="number" min="0" value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={editProduct.description ?? ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={3} />
              </div>
              <div>
                <label style={labelStyle}>Replace Image</label>
                <input type="file" accept="image/*" onChange={e => setEditImage(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditProduct(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Order Confirm Modal ── */}
      {confirmDeleteOrderId && (
        <div style={modalOverlay} onClick={() => !deletingOrderId && setConfirmDeleteOrderId(null)}>
          <div style={{ ...modalBox, maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete Order?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              This will permanently remove order{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                #{confirmDeleteOrderId.substring(0, 8).toUpperCase()}
              </strong>{' '}
              and its items. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} disabled={!!deletingOrderId} onClick={() => setConfirmDeleteOrderId(null)}>Cancel</button>
              <button
                style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '0.75rem', fontWeight: 700, cursor: deletingOrderId ? 'not-allowed' : 'pointer', opacity: deletingOrderId ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleDeleteOrder}
                disabled={!!deletingOrderId}
              >
                {deletingOrderId ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                {deletingOrderId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirm Modal ── */}
      {confirmBulkDelete && (
        <div style={modalOverlay} onClick={() => !bulkDeleting && setConfirmBulkDelete(false)}>
          <div style={{ ...modalBox, maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete {selectedIds.size} Product{selectedIds.size !== 1 ? 's' : ''}?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              This will permanently remove the selected product{selectedIds.size !== 1 ? 's' : ''} and cannot be undone.
              Products that belong to existing orders will be skipped.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} disabled={bulkDeleting} onClick={() => setConfirmBulkDelete(false)}>Cancel</button>
              <button
                style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '0.75rem', fontWeight: 700, cursor: bulkDeleting ? 'not-allowed' : 'pointer', opacity: bulkDeleting ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                {bulkDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDeleteId && (
        <div style={modalOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ ...modalBox, maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete Product?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              This will permanently remove <strong style={{ color: 'var(--text-primary)' }}>
                {products.find(p => p.id === confirmDeleteId)?.name ?? 'this product'}
              </strong> and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '0.75rem', fontWeight: 700, cursor: deletingId ? 'not-allowed' : 'pointer', opacity: deletingId ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleDeleteProduct}
                disabled={!!deletingId}
              >
                {deletingId ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
