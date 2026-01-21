import db from '../config/database';
import { SyncStatus } from '../types/syncStatus';
import { HoldingSource } from '../types/holdingSource';

export interface UserPortfolio {
    id: string;
    user_id: string;
    portfolio_alias: string;
    source?: string;
    last_synced_at?: Date;
    sync_status?: SyncStatus;
    sync_source?: HoldingSource;
    created_at: Date;
    updated_at: Date;
}

export interface SyncMetadata {
    last_synced_at: Date;
    sync_status: SyncStatus;
    sync_source: HoldingSource;
}

export class UserPortfolioModel {
    static async findById(id: string): Promise<UserPortfolio | null> {
        const result = await db.query('SELECT * FROM user_portfolios WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async findByUserId(userId: string): Promise<UserPortfolio[]> {
        const result = await db.query(
            'SELECT * FROM user_portfolios WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    static async create(portfolio: Partial<UserPortfolio>): Promise<UserPortfolio> {
        const { user_id, portfolio_alias, source } = portfolio;
        const result = await db.query(
            `INSERT INTO user_portfolios (user_id, portfolio_alias, source)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [user_id, portfolio_alias || 'Main Portfolio', source]
        );
        return result.rows[0];
    }

    static async updateAlias(id: string, alias: string): Promise<UserPortfolio | null> {
        const result = await db.query(
            `UPDATE user_portfolios 
             SET portfolio_alias = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [alias, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Update sync metadata after an import operation
     */
    static async updateSyncStatus(
        id: string,
        syncStatus: SyncStatus,
        syncSource: HoldingSource
    ): Promise<UserPortfolio | null> {
        const result = await db.query(
            `UPDATE user_portfolios 
             SET last_synced_at = NOW(), 
                 sync_status = $1, 
                 sync_source = $2,
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING *`,
            [syncStatus, syncSource, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Get sync metadata for a portfolio
     */
    static async getSyncMetadata(id: string): Promise<SyncMetadata | null> {
        const result = await db.query(
            `SELECT last_synced_at, sync_status, sync_source 
             FROM user_portfolios WHERE id = $1`,
            [id]
        );
        const row = result.rows[0];
        if (!row || !row.last_synced_at) return null;
        return {
            last_synced_at: row.last_synced_at,
            sync_status: row.sync_status,
            sync_source: row.sync_source
        };
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.query('DELETE FROM user_portfolios WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
