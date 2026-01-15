import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/otp/request', AuthController.requestOTP);
router.post('/otp/verify', AuthController.loginOTP);

// Email OTP routes (require authentication)
router.post('/email-otp/send', authenticateToken, AuthController.sendEmailOTP);
router.post('/email-otp/verify', authenticateToken, AuthController.verifyEmailOTP);

export default router;
