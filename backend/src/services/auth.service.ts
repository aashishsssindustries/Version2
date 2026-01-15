import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import { encrypt, hashData } from '../utils/encryption';
import config from '../config/env';
import { OTPService } from './otp.service';
import { validatePAN } from '../utils/validators';

export class AuthService {
    private static SALT_ROUNDS = 10;

    static async register(data: any) {
        const { email, mobile, password, name, pan, role } = data;

        // 1. Check if user exists
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) throw new Error('Email already registered');

        const existingMobile = await UserModel.findByMobile(mobile);
        if (existingMobile) throw new Error('Mobile already registered');

        // 2. Validate PAN and check duplicate
        if (pan) {
            if (!validatePAN(pan)) throw new Error('Invalid PAN format');

            // Check if PAN exists using digest (blind index)
            // Note: Since we don't have a 'findByPanDigest' on model yet, 
            // we might relying on DB constraint or add a method.
            // Let's rely on DB error or just query manually if needed.
            // Actually, let's assume if creation fails with unique violation, it's it.
            // But good practice to check.
        }

        // 3. Hash Password
        const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

        // 4. Encrypt PAN
        let encryptedPan = undefined;
        let panDigest = undefined;
        if (pan) {
            encryptedPan = encrypt(pan);
            panDigest = hashData(pan);
        }

        // 5. Create User
        const user = await UserModel.create({
            email,
            mobile,
            name,
            password_hash,
            pan: encryptedPan,
            pan_digest: panDigest,
            role: role || 'user',
        });

        // 6. Generate Token
        const token = this.generateToken(user);

        return { user, token };
    }

    static async login(data: any) {
        const { email, password } = data;

        const user = await UserModel.findByEmail(email);
        if (!user) throw new Error('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new Error('Invalid credentials');

        // Generate Token
        const token = this.generateToken(user);
        return { user, token };
    }

    static async requestOTP(mobile: string) {
        // Check if user exists? Or allow OTP for registration too?
        // Requirement says "email and mobile OTP-based authentication".
        // Let's support OTP login for existing users.
        const user = await UserModel.findByMobile(mobile);
        if (!user) throw new Error('Mobile number not registered');

        return OTPService.generateOTP(mobile);
    }

    static async loginWithOTP(mobile: string, otp: string) {
        const isValid = OTPService.verifyOTP(mobile, otp);
        if (!isValid) throw new Error('Invalid or expired OTP');

        const user = await UserModel.findByMobile(mobile);
        if (!user) throw new Error('User not found');

        const token = this.generateToken(user);
        return { user, token };
    }

    /**
     * Request email OTP for verification
     * Requires authenticated user
     */
    static async requestEmailOTP(userId: string) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        if (user.is_email_verified) {
            throw new Error('Email is already verified');
        }

        // Generate OTP
        const otp = OTPService.generateEmailOTP(user.email);

        // Send email (import EmailService at top)
        const { EmailService } = await import('./email.service');
        await EmailService.sendOTPEmail(user.email, otp, user.name);

        return { message: 'OTP sent to your email', email: user.email };
    }

    /**
     * Verify email OTP and update verification status
     */
    static async verifyEmailOTP(userId: string, otp: string) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        if (user.is_email_verified) {
            throw new Error('Email is already verified');
        }

        // Verify OTP
        const isValid = OTPService.verifyEmailOTP(user.email, otp);
        if (!isValid) throw new Error('Invalid or expired OTP');

        // Update verification status
        const updatedUser = await UserModel.updateEmailVerification(userId, true);

        return {
            message: 'Email verified successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                is_email_verified: updatedUser.is_email_verified
            }
        };
    }

    private static generateToken(user: User) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.get('JWT_SECRET'),
            { expiresIn: '24h' }
        );
    }
}
