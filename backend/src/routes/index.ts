import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import surveyRoutes from './survey.routes';
import calculatorRoutes from './calculator.routes';
import pdfRoutes from './pdf.routes';
import marketplaceRoutes from './marketplace.routes';
import userRoutes from './user.routes';
import portfolioRoutes from './portfolio.routes';
import mutualFundRoutes from './mutualFund.routes';
import projectionRoutes from './projection.routes';

const router = Router();

// API v1 routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/profile', profileRoutes);
router.use('/survey', surveyRoutes);
router.use('/calculators', calculatorRoutes);
router.use('/pdf', pdfRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/mutual-funds', mutualFundRoutes);
router.use('/projections', projectionRoutes);

export default router;


