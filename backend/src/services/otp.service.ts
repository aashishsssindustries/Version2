import logger from '../config/logger';

// In-memory store for development (Use Redis in production)
const mobileOtpStore: Map<string, { otp: string; expires: number }> = new Map();
const emailOtpStore: Map<string, { otp: string; expires: number }> = new Map();

export class OTPService {
    /**
     * Generate OTP for mobile (existing functionality)
     */
    static generateOTP(mobile: string): string {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Expires in 5 minutes
        mobileOtpStore.set(mobile, { otp, expires: Date.now() + 5 * 60 * 1000 });

        logger.info(`Mobile OTP Generated for ${mobile}: ${otp}`);
        return otp;
    }

    /**
     * Verify mobile OTP (existing functionality)
     */
    static verifyOTP(mobile: string, otp: string): boolean {
        const stored = mobileOtpStore.get(mobile);
        if (!stored) return false;

        if (Date.now() > stored.expires) {
            mobileOtpStore.delete(mobile);
            return false;
        }

        if (stored.otp === otp) {
            mobileOtpStore.delete(mobile); // One-time use
            return true;
        }

        return false;
    }

    /**
     * Generate OTP for email verification
     */
    static generateEmailOTP(email: string): string {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Expires in 5 minutes
        emailOtpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

        logger.info(`Email OTP Generated for ${email}: ${otp}`);
        return otp;
    }

    /**
     * Verify email OTP
     */
    static verifyEmailOTP(email: string, otp: string): boolean {
        const stored = emailOtpStore.get(email);
        if (!stored) {
            logger.warn(`No OTP found for email: ${email}`);
            return false;
        }

        if (Date.now() > stored.expires) {
            emailOtpStore.delete(email);
            logger.warn(`OTP expired for email: ${email}`);
            return false;
        }

        if (stored.otp === otp) {
            emailOtpStore.delete(email); // One-time use
            logger.info(`Email OTP verified successfully for: ${email}`);
            return true;
        }

        logger.warn(`Invalid OTP for email: ${email}`);
        return false;
    }

    /**
     * Clear expired OTPs (can be called periodically)
     */
    static clearExpiredOTPs(): void {
        const now = Date.now();

        // Clear expired mobile OTPs
        for (const [key, value] of mobileOtpStore.entries()) {
            if (now > value.expires) {
                mobileOtpStore.delete(key);
            }
        }

        // Clear expired email OTPs
        for (const [key, value] of emailOtpStore.entries()) {
            if (now > value.expires) {
                emailOtpStore.delete(key);
            }
        }
    }
}
