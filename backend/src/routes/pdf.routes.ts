import { Router } from 'express';
import { PDFController } from '../controllers/pdf.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/pdf/advisory-report
 * @desc    Generate and download Advisory Report PDF (V1)
 * @access  Private (requires authentication)
 */
router.post('/advisory-report', authenticateToken, PDFController.generateAdvisoryReport);

/**
 * @route   POST /api/pdf/advisory-report-v2
 * @desc    Generate White-Labeled Advisory Report V2
 * @access  Private (requires authentication)
 * @body    branding?: { companyName, tagline, primaryColor, disclaimerAddendum }
 */
router.post('/advisory-report-v2', authenticateToken, PDFController.generateAdvisoryReportV2);

/**
 * @route   GET /api/pdf/advisory-report-v3
 * @desc    Generate White-Labeled Advisory Report V3 (Puppeteer HTML-to-PDF)
 * @access  Private (requires authentication)
 * @query   company_name, logo_url, primary_color
 */
router.get('/advisory-report-v3', authenticateToken, PDFController.generateAdvisoryReportV3);

export default router;
