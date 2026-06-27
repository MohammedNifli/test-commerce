import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

/** Shared "added to cart" toast — state hook + presentational component. */
export function useCartToast() {
  const [toast, setToast] = useState<{ name: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (name: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ name });
    timer.current = setTimeout(() => setToast(null), 3000);
  };

  return { toast, show };
}

export const CartToast = ({ toast }: { toast: { name: string } | null }) => {
  const navigate = useNavigate();
  if (!toast) return null;
  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <div className="cart-toast-icon">
        <CheckCircle size={20} style={{ color: '#22c55e' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#22c55e' }}>Added to cart</div>
        <div className="cart-toast-name">{toast.name}</div>
      </div>
      <button className="cart-toast-btn" onClick={() => navigate('/cart')}>View Cart</button>
    </div>
  );
};
