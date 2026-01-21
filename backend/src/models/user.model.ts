import db from '../config/database';

export interface User {
    id: string;
    email: string;
    mobile: string;
    name: string;
    pan?: string;
    pan_digest?: string;
    password_hash: string;
    role: 'user' | 'admin';
    is_email_verified: boolean;
    is_mobile_verified: boolean;
    reset_password_token?: string;
    reset_password_expires?: Date;
    created_at: Date;
    updated_at: Date;
}

import { EncryptionService } from '../services/encryption.service';
import crypto from 'crypto';

export class UserModel {
    static async create(user: Partial<User>): Promise<User> {
        const { email, mobile, name, pan, password_hash, role } = user;

        let encryptedPan = pan;
        let panDigest = user.pan_digest;

        if (pan) {
            // Encrypt PAN
            encryptedPan = EncryptionService.encrypt(pan) || undefined;
            // Generate SHA-256 digest for lookup/uniqueness check
            panDigest = crypto.createHash('sha256').update(pan).digest('hex');
        }

        const result = await db.query(
            `INSERT INTO users (email, mobile, name, pan, pan_digest, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [email, mobile, name, encryptedPan, panDigest, password_hash, role || 'user']
        );
        return result.rows[0];
    }

    static async findByEmail(email: string): Promise<User | null> {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    static async findByMobile(mobile: string): Promise<User | null> {
        const result = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
        return result.rows[0] || null;
    }

    static async findById(id: string): Promise<User | null> {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async updateEmailVerification(userId: string, verified: boolean): Promise<User> {
        const result = await db.query(
            'UPDATE users SET is_email_verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [verified, userId]
        );
        if (!result.rows[0]) {
            throw new Error('User not found');
        }
        return result.rows[0];
    }

    static async saveResetToken(email: string, token: string, expires: Date): Promise<User> {
        const result = await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2, updated_at = NOW() WHERE email = $3 RETURNING *',
            [token, expires, email]
        );
        return result.rows[0];
    }

    static async findByResetToken(token: string): Promise<User | null> {
        const result = await db.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        return result.rows[0] || null;
    }

    static async updatePassword(userId: string, passwordHash: string): Promise<User> {
        const result = await db.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() WHERE id = $2 RETURNING *',
            [passwordHash, userId]
        );
        return result.rows[0];
    }

    static async updateProfile(userId: string, updates: { name?: string; mobile?: string }): Promise<User> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.name) {
            fields.push(`name = $${paramIndex++}`);
            values.push(updates.name);
        }

        if (updates.mobile) {
            fields.push(`mobile = $${paramIndex++}`);
            values.push(updates.mobile);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        fields.push(`updated_at = NOW()`);
        values.push(userId);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await db.query(query, values);

        if (!result.rows[0]) {
            throw new Error('User not found');
        }

        return result.rows[0];
    }
}

