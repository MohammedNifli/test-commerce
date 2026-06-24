import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

import adminAuthRoutes from './routes/adminAuth';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import speakoRoutes from './routes/speako';

// Routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

// Speako AI assistant integration (isolated surface — see routes/speako.ts)
app.use('/api/speako', speakoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
