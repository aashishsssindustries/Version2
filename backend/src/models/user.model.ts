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
    created_at: Date;
    updated_at: Date;
}

export class UserModel {
    static async create(user: Partial<User>): Promise<User> {
        const { email, mobile, name, pan, pan_digest, password_hash, role } = user;
        const result = await db.query(
            `INSERT INTO users (email, mobile, name, pan, pan_digest, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [email, mobile, name, pan, pan_digest, password_hash, role || 'user']
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
}

