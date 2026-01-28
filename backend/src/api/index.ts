import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import productRoutes from './products';
import voucherRoutes from './vouchers';
import orderRoutes from './orders';
import logRoutes from './logs';
import profileRoutes from './profile'; // Add this line
import categoryRoutes from './categories'; // Tambahkan ini
import cartRoutes from './cart';
import paymentRoutes from './payment';

const router = Router();

// Mount semua API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/orders', orderRoutes);
router.use('/logs', logRoutes);
router.use('/profile', profileRoutes); // Add this line
router.use('/categories', categoryRoutes); // Tambahkan ini
router.use('/cart', cartRoutes);
router.use('/payment', paymentRoutes);

export default router;