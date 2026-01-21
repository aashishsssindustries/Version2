import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();


router.get('/', authenticateToken, ProfileController.getProfile);
router.post('/update', authenticateToken, ProfileController.updateProfile);
router.put('/action-items/:id/status', authenticateToken, ProfileController.updateActionItemStatus);
router.get('/score-history', authenticateToken, ProfileController.getScoreHistory);
router.get('/next-best-action', authenticateToken, ProfileController.getNextBestAction);
router.get('/audit-logs', authenticateToken, ProfileController.getAuditLogs);

export default router;
