import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadPdf } from '../middleware/upload.middleware';

const router = Router();

// Add a single holding manually
router.post('/manual', authenticateToken, PortfolioController.addManualHolding);

// Upload holdings via CSV
router.post('/upload-csv', authenticateToken, PortfolioController.uploadCSV);

// Upload holdings from CAS PDF
router.post('/upload-cas', authenticateToken, uploadPdf.single('file'), PortfolioController.uploadCAS);

// Get all user holdings
router.get('/holdings', authenticateToken, PortfolioController.getHoldings);

// Get portfolio alignment analysis
router.get('/alignment', authenticateToken, PortfolioController.getAlignment);

// Delete a specific holding
router.delete('/holdings/:id', authenticateToken, PortfolioController.deleteHolding);

export default router;
