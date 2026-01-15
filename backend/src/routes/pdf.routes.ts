import { Router } from 'express';
import { PDFController } from '../controllers/pdf.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/pdf/advisory-report
 * @desc    Generate and download Advisory Report PDF
 * @access  Private (requires authentication)
 */
router.post('/advisory-report', authenticateToken, PDFController.generateAdvisoryReport);

export default router;
