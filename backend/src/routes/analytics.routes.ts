import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get comprehensive portfolio snapshot
router.get('/portfolio-snapshot', authenticateToken, AnalyticsController.getPortfolioSnapshot);

export default router;
