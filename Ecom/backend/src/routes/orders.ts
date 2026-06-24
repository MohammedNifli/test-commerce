import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/ordersController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Public route to place an order
router.post('/', createOrder);

// Protected admin routes
router.get('/', authenticateAdmin, getOrders);
router.put('/:id/status', authenticateAdmin, updateOrderStatus);

export default router;
