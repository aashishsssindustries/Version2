
import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', GoalController.create);
router.get('/', GoalController.getAll);
router.delete('/:id', GoalController.delete);

export default router;
