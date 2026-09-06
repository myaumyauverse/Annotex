import { Router } from 'express';
import analyticsRoutes from './analytics.routes.js';
import authRoutes from './auth.routes.js';
import blockchainRoutes from './blockchain.routes.js';
import datasetRoutes from './dataset.routes.js';
import labelRoutes from './label.routes.js';
import payoutRoutes from './payout.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

/**
 * Mount all routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/datasets', datasetRoutes);
router.use('/labels', labelRoutes);
router.use('/payouts', payoutRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/blockchain', blockchainRoutes);

export default router;
