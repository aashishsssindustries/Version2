import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/recommendations', authenticateToken, MarketplaceController.getRecommendations);

// Discovery Routes (Public)
router.get('/catalog', MarketplaceController.getCatalog);
router.get('/catalog/:id', MarketplaceController.getProductDetail);
router.get('/search', MarketplaceController.searchProducts);
router.get('/categories', MarketplaceController.getCategories);
router.get('/filters', MarketplaceController.getFilters);

export default router;
