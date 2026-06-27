import express from 'express';
import { createOrder, getOrders, getOrdersByEmail, updateOrderStatus } from '../controllers/ordersController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Public route to place an order
router.post('/', createOrder);

// Public: customer order history lookup by email (must precede param routes)
router.get('/my', getOrdersByEmail);

// Protected admin routes
router.get('/', authenticateAdmin, getOrders);
router.put('/:id/status', authenticateAdmin, updateOrderStatus);

export default router;
