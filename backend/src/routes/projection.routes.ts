import { Router } from 'express';
import { ProjectionController } from '../controllers/projection.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All projection routes require authentication
router.use(authenticateToken);

// Individual projections
router.post('/sip', ProjectionController.getSIPProjection);
router.post('/retirement', ProjectionController.getRetirementGlidePath);
router.post('/goal', ProjectionController.getGoalFundingTimeline);

// Bundled projections for reports
router.get('/report', ProjectionController.getReportBundle);

export default router;
