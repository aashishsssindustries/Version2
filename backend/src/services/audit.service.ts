import db from '../config/database';
import logger from '../config/logger';

export interface AuditEvent {
    userId?: string;
    action: string;
    resource: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    /**
     * Log a security or compliance event
     */
    static async log(event: AuditEvent): Promise<void> {
        try {
            await db.query(
                `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    event.userId || null,
                    event.action,
                    event.resource,
                    JSON.stringify(event.details || {}),
                    event.ipAddress || null,
                    event.userAgent || null
                ]
            );
        } catch (error) {
            logger.error('Audit logging error', error);
        }
    }

    /**
     * Retrieve logs for a specific user (Compliance Admin use case)
     */
    static async getLogsByUser(userId: string): Promise<any[]> {
        try {
            const result = await db.query(
                'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );
            return result.rows;
        } catch (error) {
            logger.error('Failed to fetch audit logs', error);
            throw new Error('Failed to fetch audit logs');
        }
    }
}
