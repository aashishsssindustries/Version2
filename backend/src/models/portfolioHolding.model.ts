import db from '../config/database';
import { HoldingSource, DEFAULT_HOLDING_SOURCE } from '../types/holdingSource';

export interface PortfolioHolding {
    id: string;
    portfolio_id: string;
    isin: string;
    quantity: number;
    average_price?: number;
    last_valuation?: number;
    source?: HoldingSource;
    created_at: Date;
    updated_at: Date;
}

export interface PortfolioHoldingWithMetadata extends PortfolioHolding {
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    ticker?: string;
    current_nav?: number;
    source: HoldingSource;
}

export class PortfolioHoldingModel {
    static async findById(id: string): Promise<PortfolioHolding | null> {
        const result = await db.query('SELECT * FROM portfolio_holdings WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async findByPortfolioId(portfolioId: string): Promise<PortfolioHoldingWithMetadata[]> {
        const result = await db.query(
            `SELECT ph.id, ph.portfolio_id, ph.isin, ph.quantity, ph.average_price, 
                    ph.last_valuation, ph.source, ph.created_at, ph.updated_at,
                    hm.name, hm.type, hm.ticker, hm.current_nav
             FROM portfolio_holdings ph
             JOIN holding_metadata hm ON ph.isin = hm.isin
             WHERE ph.portfolio_id = $1
             ORDER BY hm.name`,
            [portfolioId]
        );
        return result.rows;
    }

    static async findByUserIdWithMetadata(userId: string): Promise<PortfolioHoldingWithMetadata[]> {
        const result = await db.query(
            `SELECT ph.id, ph.portfolio_id, ph.isin, ph.quantity, ph.average_price, 
                    ph.last_valuation, ph.source, ph.created_at, ph.updated_at,
                    hm.name, hm.type, hm.ticker, hm.current_nav, up.portfolio_alias
             FROM portfolio_holdings ph
             JOIN holding_metadata hm ON ph.isin = hm.isin
             JOIN user_portfolios up ON ph.portfolio_id = up.id
             WHERE up.user_id = $1
             ORDER BY hm.type, hm.name`,
            [userId]
        );
        return result.rows;
    }

    static async findByIsin(isin: string): Promise<PortfolioHolding[]> {
        const result = await db.query(
            'SELECT * FROM portfolio_holdings WHERE isin = $1',
            [isin]
        );
        return result.rows;
    }

    static async create(holding: Partial<PortfolioHolding>): Promise<PortfolioHolding> {
        const { portfolio_id, isin, quantity, average_price, last_valuation, source } = holding;
        const holdingSource = source || DEFAULT_HOLDING_SOURCE;
        const result = await db.query(
            `INSERT INTO portfolio_holdings (portfolio_id, isin, quantity, average_price, last_valuation, source)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [portfolio_id, isin, quantity, average_price, last_valuation, holdingSource]
        );
        return result.rows[0];
    }

    static async updateQuantity(id: string, quantity: number): Promise<PortfolioHolding | null> {
        const result = await db.query(
            `UPDATE portfolio_holdings 
             SET quantity = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [quantity, id]
        );
        return result.rows[0] || null;
    }

    static async updateValuation(id: string, valuation: number): Promise<PortfolioHolding | null> {
        const result = await db.query(
            `UPDATE portfolio_holdings 
             SET last_valuation = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [valuation, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.query('DELETE FROM portfolio_holdings WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    static async getTotalValuationByUserId(userId: string): Promise<number> {
        const result = await db.query(
            `SELECT COALESCE(SUM(ph.last_valuation), 0) as total
             FROM portfolio_holdings ph
             JOIN user_portfolios up ON ph.portfolio_id = up.id
             WHERE up.user_id = $1`,
            [userId]
        );
        return parseFloat(result.rows[0]?.total || '0');
    }
}
