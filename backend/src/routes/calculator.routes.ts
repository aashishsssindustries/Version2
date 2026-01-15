import { Router } from 'express';
import { CalculatorController } from '../controllers/calculator.controller';

const router = Router();

// Core
router.post('/sip', CalculatorController.calculateSIP);
router.post('/emi', CalculatorController.calculateEMI);
router.post('/retirement', CalculatorController.calculateRetirement);

// New Suite
router.post('/life-insurance', CalculatorController.calculateLifeInsurance);
router.post('/education', CalculatorController.calculateEducation);
router.post('/cost-of-delay', CalculatorController.calculateCostOfDelay);
router.post('/hra', CalculatorController.calculateHRA);
router.post('/home-affordability', CalculatorController.calculateHomeAffordability);
router.post('/cagr', CalculatorController.calculateCAGR);

export default router;
