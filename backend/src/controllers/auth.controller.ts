import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../config/logger';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.name,
                        role: result.user.role
                    },
                    token: result.token
                }
            });
        } catch (error: any) {
            logger.error('Registration error', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed'
            });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const result = await AuthService.login(req.body);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.name,
                        role: result.user.role
                    },
                    token: result.token
                }
            });
        } catch (error: any) {
            logger.error('Login error', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Login failed'
            });
        }
    }

    static async requestOTP(req: Request, res: Response) {
        try {
            const { mobile } = req.body;
            const otp = await AuthService.requestOTP(mobile);
            // In a real app we would send SMS. Here we return it for dev, or just say sent.
            // Returning it in response is insecure for prod but great for manual verification now.
            res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                data: { otp } // Dev only
            });
        } catch (error: any) {
            logger.error('OTP Request error', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async loginOTP(req: Request, res: Response) {
        try {
            const { mobile, otp } = req.body;
            const result = await AuthService.loginWithOTP(mobile, otp);
            res.status(200).json({
                success: true,
                message: 'OTP Login successful',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        role: result.user.role
                    },
                    token: result.token
                }
            });
        } catch (error: any) {
            logger.error('OTP Login error', error);
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Send email OTP for verification
     * Requires authentication
     */
    static async sendEmailOTP(req: Request, res: Response) {
        try {
            // User ID comes from auth middleware (req.user)
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await AuthService.requestEmailOTP(userId);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: { email: result.email }
            });
        } catch (error: any) {
            logger.error('Send Email OTP error', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Verify email OTP
     * Requires authentication
     */
    static async verifyEmailOTP(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { otp } = req.body;
            if (!otp) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP is required'
                });
            }

            const result = await AuthService.verifyEmailOTP(userId, otp);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: result.user
            });
        } catch (error: any) {
            logger.error('Verify Email OTP error', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}
