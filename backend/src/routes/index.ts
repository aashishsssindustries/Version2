import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import surveyRoutes from './survey.routes';
import calculatorRoutes from './calculator.routes';
import pdfRoutes from './pdf.routes';
import marketplaceRoutes from './marketplace.routes';

const router = Router();

// API v1 routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/survey', surveyRoutes);
router.use('/calculators', calculatorRoutes);
router.use('/pdf', pdfRoutes);
router.use('/marketplace', marketplaceRoutes);

// Future routes will be added here
// router.use('/portfolio', portfolioRoutes);

export default router;
