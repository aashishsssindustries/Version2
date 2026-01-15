import { Router } from 'express';
import { getHealth, getDetailedHealth } from '../controllers/health.controller';

const router = Router();

router.get('/', getHealth);
router.get('/detailed', getDetailedHealth);

export default router;
