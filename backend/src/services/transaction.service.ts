import { TransactionModel, TransactionInput } from '../models/transaction.model';
import { CASTransaction } from './casParser.service';
import { PortfolioService } from './portfolio.service';
import logger from '../config/logger';

export interface TransactionImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

export interface CashflowSummary {
    totalInflow: number;
    totalOutflow: number;
    netCashflow: number;
    transactionCount: number;
    byType: {
        [key: string]: {
            count: number;
            amount: number;
        };
    };
}

export interface CashflowByPeriod {
    period: string; // YYYY-MM
    inflow: number;
    outflow: number;
    net: number;
}

export class TransactionService {
    /**
     * Import transactions from CAS parsing result
     * Handles duplicate detection and marks all with source = 'CAS'
     */
    static async importCASTransactions(
        userId: string,
        transactions: CASTransaction[]
    ): Promise<TransactionImportResult> {
        const errors: string[] = [];
        let imported = 0;
        let skipped = 0;

        if (transactions.length === 0) {
            return { imported, skipped, errors };
        }

        // Get or create default portfolio
        const portfolioId = await PortfolioService.getOrCreateDefaultPortfolio(userId);

        // Prepare transaction inputs
        const transactionInputs: TransactionInput[] = transactions.map(txn => ({
            portfolio_id: portfolioId,
            isin: txn.isin,
            transaction_date: txn.transactionDate,
            transaction_type: txn.transactionType,
            units: txn.units,
            amount: txn.amount,
            nav: txn.nav,
            folio: txn.folio,
            source: 'CAS'
        }));

        // Use batch import with duplicate detection
        const result = await TransactionModel.createBatch(transactionInputs);

        imported = result.imported;
        skipped = result.skipped;
        errors.push(...result.errors);

        logger.info(`CAS transaction import complete for user ${userId}`, {
            imported,
            skipped,
            errors: errors.length
        });

        return { imported, skipped, errors };
    }

    /**
     * Get all transactions for a user
     */
    static async getUserTransactions(userId: string) {
        return TransactionModel.findByUserId(userId);
    }

    /**
     * Get transaction count for a user
     */
    static async getUserTransactionCount(userId: string): Promise<number> {
        return TransactionModel.getCountByUserId(userId);
    }

    /**
     * Get transactions for a specific ISIN
     */
    static async getTransactionsByIsin(userId: string, isin: string) {
        return TransactionModel.findByIsinAndUserId(isin, userId);
    }

    /**
     * Get transactions for a specific portfolio
     */
    static async getPortfolioTransactions(portfolioId: string) {
        return TransactionModel.findByPortfolioId(portfolioId);
    }

    /**
     * Aggregate cashflows for a user
     * Provides total inflows, outflows, and net cashflow
     */
    static async aggregateCashflows(userId: string): Promise<CashflowSummary> {
        const transactions = await TransactionModel.findByUserId(userId);

        let totalInflow = 0;
        let totalOutflow = 0;
        const byType: { [key: string]: { count: number; amount: number } } = {};

        for (const txn of transactions) {
            const amount = parseFloat(txn.amount.toString());
            const type = txn.transaction_type;

            // BUY, SIP, SWITCH_IN are inflows
            if (['BUY', 'SIP', 'SWITCH_IN'].includes(type)) {
                totalInflow += amount;
            }
            // SELL, REDEMPTION, SWITCH_OUT are outflows
            else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(type)) {
                totalOutflow += amount;
            }
            // DIVIDEND is treated as inflow
            else if (type === 'DIVIDEND') {
                totalInflow += amount;
            }

            // Aggregate by type
            if (!byType[type]) {
                byType[type] = { count: 0, amount: 0 };
            }
            byType[type].count++;
            byType[type].amount += amount;
        }

        return {
            totalInflow: parseFloat(totalInflow.toFixed(2)),
            totalOutflow: parseFloat(totalOutflow.toFixed(2)),
            netCashflow: parseFloat((totalInflow - totalOutflow).toFixed(2)),
            transactionCount: transactions.length,
            byType
        };
    }

    /**
     * Aggregate cashflows by month for time-series analysis
     */
    static async aggregateCashflowsByPeriod(
        userId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<CashflowByPeriod[]> {
        let transactions = await TransactionModel.findByUserId(userId);

        // Filter by date range if provided
        if (startDate) {
            transactions = transactions.filter(t => new Date(t.transaction_date) >= startDate);
        }
        if (endDate) {
            transactions = transactions.filter(t => new Date(t.transaction_date) <= endDate);
        }

        // Group by month
        const periodMap = new Map<string, { inflow: number; outflow: number }>();

        for (const txn of transactions) {
            const date = new Date(txn.transaction_date);
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(txn.amount.toString());
            const type = txn.transaction_type;

            if (!periodMap.has(period)) {
                periodMap.set(period, { inflow: 0, outflow: 0 });
            }

            const periodData = periodMap.get(period)!;

            // Categorize inflow/outflow
            if (['BUY', 'SIP', 'SWITCH_IN', 'DIVIDEND'].includes(type)) {
                periodData.inflow += amount;
            } else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(type)) {
                periodData.outflow += amount;
            }
        }

        // Convert to array and sort by period
        const result: CashflowByPeriod[] = Array.from(periodMap.entries())
            .map(([period, data]) => ({
                period,
                inflow: parseFloat(data.inflow.toFixed(2)),
                outflow: parseFloat(data.outflow.toFixed(2)),
                net: parseFloat((data.inflow - data.outflow).toFixed(2))
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        return result;
    }

    /**
     * Get cashflow summary for a specific ISIN
     */
    static async getCashflowByIsin(userId: string, isin: string): Promise<CashflowSummary> {
        const transactions = await TransactionModel.findByIsinAndUserId(isin, userId);

        let totalInflow = 0;
        let totalOutflow = 0;
        const byType: { [key: string]: { count: number; amount: number } } = {};

        for (const txn of transactions) {
            const amount = parseFloat(txn.amount.toString());
            const type = txn.transaction_type;

            if (['BUY', 'SIP', 'SWITCH_IN'].includes(type)) {
                totalInflow += amount;
            } else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(type)) {
                totalOutflow += amount;
            } else if (type === 'DIVIDEND') {
                totalInflow += amount;
            }

            if (!byType[type]) {
                byType[type] = { count: 0, amount: 0 };
            }
            byType[type].count++;
            byType[type].amount += amount;
        }

        return {
            totalInflow: parseFloat(totalInflow.toFixed(2)),
            totalOutflow: parseFloat(totalOutflow.toFixed(2)),
            netCashflow: parseFloat((totalInflow - totalOutflow).toFixed(2)),
            transactionCount: transactions.length,
            byType
        };
    }
}
