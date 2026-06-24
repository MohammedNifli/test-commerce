// Backend origin (no trailing slash, no /api). In production set VITE_API_URL on
// the host (e.g. Vercel) to your deployed backend, e.g. https://test-commerce.onrender.com
// Locally it defaults to the dev backend.
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// Resolve a product image: external URLs are used as-is; stored /uploads paths
// are prefixed with the backend origin.
export const imgSrc = (url?: string | null): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};
