import express from 'express';
import {
  listProducts,
  searchProducts,
  getProduct,
  getCategories,
  getCart,
  addToCart,
  removeFromCart,
  updateCart,
  getOrders,
  getStoreInfo,
  getStorePolicies,
} from '../controllers/speakoController';
import { authenticateSpeako } from '../middleware/speakoAuth';

const router = express.Router();

// ── Product catalog (public — mirrors ElectroTech's public catalog) ───────────
// `/search` must be declared before `/:id` so it isn't captured as an id.
router.get('/products/search', searchProducts);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.get('/categories', getCategories);

// ── Store info (public) ───────────────────────────────────────────────────────
router.get('/store/info', getStoreInfo);
router.get('/store/policies', getStorePolicies);

// ── Cart + orders (require the Speako API key) ────────────────────────────────
router.get('/cart', authenticateSpeako, getCart);
router.post('/cart/add', authenticateSpeako, addToCart);
router.post('/cart/remove', authenticateSpeako, removeFromCart);
router.put('/cart/update', authenticateSpeako, updateCart);
router.get('/orders', authenticateSpeako, getOrders);

export default router;
