import crypto from 'crypto';
import logger from '../config/logger';

export class EncryptionService {
    private static readonly ALGORITHM = 'aes-256-cbc';
    // Use a default key for dev if env var is missing (WARNING: NOT FOR PRODUCTION)
    // In production, this MUST be provided via environment variable
    private static readonly KEY = process.env.ENCRYPTION_KEY
        ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
        : crypto.createHash('sha256').update('wealthmax-dev-secret-key').digest();

    private static readonly IV_LENGTH = 16;

    /**
     * Encrypt text using AES-256-CBC
     * Returns format: iv:encryptedText (hex encoded)
     */
    static encrypt(text: string): string | null {
        if (!text) return null;

        try {
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
        } catch (error) {
            logger.error('Encryption failed', error);
            throw new Error('Encryption failed');
        }
    }

    /**
     * Decrypt text using AES-256-CBC
     * Expects format: iv:encryptedText (hex encoded)
     */
    static decrypt(text: string): string | null {
        if (!text) return null;

        try {
            const parts = text.split(':');
            if (parts.length !== 2) return text; // Return as-is if not in expected format

            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = Buffer.from(parts[1], 'hex');
            const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            logger.error('Decryption failed', error);
            // In case of error (e.g., bad key, bad data), return null or original?
            // Returning null is safer than crashing, but we should log it.
            return null;
        }
    }
}
