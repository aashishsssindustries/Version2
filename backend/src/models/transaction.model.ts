import db from '../config/database';
import { TransactionType } from '../types/transactionType';

export interface PortfolioTransaction {
    id: string;
    portfolio_id: string;
    isin: string;
    transaction_date: Date;
    transaction_type: TransactionType;
    units: number;
    amount: number;
    nav?: number;
    folio?: string;
    source: string;
    created_at: Date;
}

export interface TransactionInput {
    portfolio_id: string;
    isin: string;
    transaction_date: Date;
    transaction_type: TransactionType;
    units: number;
    amount: number;
    nav?: number;
    folio?: string;
    source?: string;
}

export class TransactionModel {
    /**
     * Find transactions by portfolio ID
     */
    static async findByPortfolioId(portfolioId: string): Promise<PortfolioTransaction[]> {
        const result = await db.query(
            `SELECT * FROM portfolio_transactions 
             WHERE portfolio_id = $1 
             ORDER BY transaction_date DESC`,
            [portfolioId]
        );
        return result.rows;
    }

    /**
     * Find all transactions for a user
     */
    static async findByUserId(userId: string): Promise<PortfolioTransaction[]> {
        const result = await db.query(
            `SELECT pt.* FROM portfolio_transactions pt
             JOIN user_portfolios up ON pt.portfolio_id = up.id
             WHERE up.user_id = $1
             ORDER BY pt.transaction_date DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Create a single transaction
     */
    static async create(input: TransactionInput): Promise<PortfolioTransaction> {
        const { portfolio_id, isin, transaction_date, transaction_type, units, amount, nav, folio, source } = input;
        const result = await db.query(
            `INSERT INTO portfolio_transactions 
             (portfolio_id, isin, transaction_date, transaction_type, units, amount, nav, folio, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [portfolio_id, isin, transaction_date, transaction_type, units, amount, nav, folio, source || 'CAS']
        );
        return result.rows[0];
    }

    /**
     * Check if a transaction already exists (duplicate detection)
     */
    static async checkDuplicate(
        portfolioId: string,
        isin: string,
        transactionDate: Date,
        transactionType: TransactionType,
        units: number,
        amount: number
    ): Promise<boolean> {
        const result = await db.query(
            `SELECT id FROM portfolio_transactions 
             WHERE portfolio_id = $1 
             AND isin = $2 
             AND transaction_date = $3 
             AND transaction_type = $4 
             AND units = $5 
             AND amount = $6`,
            [portfolioId, isin, transactionDate, transactionType, units, amount]
        );
        return result.rows.length > 0;
    }

    /**
     * Create transactions in batch, skipping duplicates
     */
    static async createBatch(
        inputs: TransactionInput[]
    ): Promise<{ imported: number; skipped: number; errors: string[] }> {
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const input of inputs) {
            try {
                // Check for duplicate
                const isDuplicate = await this.checkDuplicate(
                    input.portfolio_id,
                    input.isin,
                    input.transaction_date,
                    input.transaction_type,
                    input.units,
                    input.amount
                );

                if (isDuplicate) {
                    skipped++;
                    continue;
                }

                await this.create(input);
                imported++;
            } catch (error: any) {
                // Handle unique constraint violation gracefully
                if (error.code === '23505') {
                    skipped++;
                } else {
                    errors.push(`Failed to import transaction for ${input.isin}: ${error.message}`);
                }
            }
        }

        return { imported, skipped, errors };
    }

    /**
     * Get transaction count for a user
     */
    static async getCountByUserId(userId: string): Promise<number> {
        const result = await db.query(
            `SELECT COUNT(*) as count FROM portfolio_transactions pt
             JOIN user_portfolios up ON pt.portfolio_id = up.id
             WHERE up.user_id = $1`,
            [userId]
        );
        return parseInt(result.rows[0]?.count || '0', 10);
    }

    /**
     * Get transactions by ISIN for a user
     */
    static async findByIsinAndUserId(isin: string, userId: string): Promise<PortfolioTransaction[]> {
        const result = await db.query(
            `SELECT pt.* FROM portfolio_transactions pt
             JOIN user_portfolios up ON pt.portfolio_id = up.id
             WHERE pt.isin = $1 AND up.user_id = $2
             ORDER BY pt.transaction_date DESC`,
            [isin, userId]
        );
        return result.rows;
    }
}
