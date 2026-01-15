import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/recommendations', authenticateToken, MarketplaceController.getRecommendations);

export default router;
