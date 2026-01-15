import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();


router.get('/', authenticateToken, ProfileController.getProfile);
router.post('/update', authenticateToken, ProfileController.updateProfile);
router.get('/next-best-action', authenticateToken, ProfileController.getNextBestAction);

export default router;
