import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/questions', authenticateToken, SurveyController.getQuestions);
router.post('/submit', authenticateToken, SurveyController.submitSurvey);

export default router;
