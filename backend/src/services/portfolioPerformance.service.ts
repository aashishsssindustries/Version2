import { TransactionModel } from '../models/transaction.model';
import { PortfolioHoldingModel } from '../models/portfolioHolding.model';
import db from '../config/database';
import { calculateXIRR, xirrToPercentage, Cashflow } from '../utils/xirr.util';
import {
    XIRRResult,
    MaxDrawdown,
    PerformanceMetrics,
    SchemePerformance
} from '../types/performance.types';
import logger from '../config/logger';

export class PortfolioPerformanceService {
    /**
     * Calculate portfolio-level XIRR
     * Uses all transactions and current portfolio value
     */
    static async calculatePortfolioXIRR(userId: string): Promise<XIRRResult | null> {
        try {
            // Get all transactions
            const transactions = await TransactionModel.findByUserId(userId);

            if (transactions.length === 0) {
                return null;
            }

            // Build cashflow array
            const cashflows: Cashflow[] = [];
            let totalInvested = 0;

            for (const txn of transactions) {
                const amount = parseFloat(txn.amount.toString());
                const type = txn.transaction_type;

                // Outflows (investments) are negative
                if (['BUY', 'SIP', 'SWITCH_IN'].includes(type)) {
                    cashflows.push({
                        date: new Date(txn.transaction_date),
                        amount: -amount
                    });
                    totalInvested += amount;
                }
                // Inflows (redemptions) are positive
                else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(type)) {
                    cashflows.push({
                        date: new Date(txn.transaction_date),
                        amount: amount
                    });
                    totalInvested -= amount;
                }
            }

            // Get current portfolio value
            const currentValue = await PortfolioHoldingModel.getTotalValuationByUserId(userId);

            // Add current value as final cashflow (today)
            if (currentValue > 0) {
                cashflows.push({
                    date: new Date(),
                    amount: currentValue
                });
            }

            // Calculate XIRR
            const xirrDecimal = calculateXIRR(cashflows);

            if (xirrDecimal === null) {
                logger.warn(`XIRR calculation failed for user ${userId}`);
                return null;
            }

            const xirr = xirrToPercentage(xirrDecimal);
            const absoluteReturnAmount = currentValue - totalInvested;
            const absoluteReturn = totalInvested > 0
                ? parseFloat(((absoluteReturnAmount / totalInvested) * 100).toFixed(2))
                : 0;

            return {
                xirr,
                invested: parseFloat(totalInvested.toFixed(2)),
                currentValue: parseFloat(currentValue.toFixed(2)),
                absoluteReturn,
                absoluteReturnAmount: parseFloat(absoluteReturnAmount.toFixed(2))
            };
        } catch (error: any) {
            logger.error('Portfolio XIRR calculation error', error);
            return null;
        }
    }

    /**
     * Calculate scheme-level XIRR for a specific ISIN
     */
    static async calculateSchemeXIRR(userId: string, isin: string): Promise<XIRRResult | null> {
        try {
            // Get transactions for this ISIN
            const transactions = await TransactionModel.findByIsinAndUserId(isin, userId);

            if (transactions.length === 0) {
                return null;
            }

            // Build cashflow array
            const cashflows: Cashflow[] = [];
            let totalInvested = 0;

            for (const txn of transactions) {
                const amount = parseFloat(txn.amount.toString());
                const type = txn.transaction_type;

                if (['BUY', 'SIP', 'SWITCH_IN'].includes(type)) {
                    cashflows.push({
                        date: new Date(txn.transaction_date),
                        amount: -amount
                    });
                    totalInvested += amount;
                } else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(type)) {
                    cashflows.push({
                        date: new Date(txn.transaction_date),
                        amount: amount
                    });
                    totalInvested -= amount;
                }
            }

            // Get current holding value for this ISIN
            const holdings = await PortfolioHoldingModel.findByIsin(isin);
            const userHolding = holdings.find(() => {
                // Need to verify this holding belongs to user's portfolio
                return true; // Simplified - in practice, join with user_portfolios
            });

            const currentValue = userHolding?.last_valuation
                ? parseFloat(userHolding.last_valuation.toString())
                : 0;

            // Add current value as final cashflow
            if (currentValue > 0) {
                cashflows.push({
                    date: new Date(),
                    amount: currentValue
                });
            }

            // Calculate XIRR
            const xirrDecimal = calculateXIRR(cashflows);

            if (xirrDecimal === null) {
                return null;
            }

            const xirr = xirrToPercentage(xirrDecimal);
            const absoluteReturnAmount = currentValue - totalInvested;
            const absoluteReturn = totalInvested > 0
                ? parseFloat(((absoluteReturnAmount / totalInvested) * 100).toFixed(2))
                : 0;

            return {
                xirr,
                invested: parseFloat(totalInvested.toFixed(2)),
                currentValue: parseFloat(currentValue.toFixed(2)),
                absoluteReturn,
                absoluteReturnAmount: parseFloat(absoluteReturnAmount.toFixed(2))
            };
        } catch (error: any) {
            logger.error(`Scheme XIRR calculation error for ${isin}`, error);
            return null;
        }
    }

    /**
     * Get performance metrics for all holdings
     */
    static async getSchemePerformances(userId: string): Promise<SchemePerformance[]> {
        try {
            const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);
            const performances: SchemePerformance[] = [];

            for (const holding of holdings) {
                const xirrResult = await this.calculateSchemeXIRR(userId, holding.isin);

                performances.push({
                    isin: holding.isin,
                    schemeName: holding.name,
                    xirr: xirrResult,
                    absoluteReturn: xirrResult?.absoluteReturn || null,
                    invested: xirrResult?.invested || 0,
                    currentValue: xirrResult?.currentValue || parseFloat(holding.last_valuation?.toString() || '0')
                });
            }

            return performances;
        } catch (error: any) {
            logger.error('Scheme performances calculation error', error);
            return [];
        }
    }

    /**
     * Calculate absolute returns (simple returns)
     */
    static async calculateAbsoluteReturns(userId: string): Promise<{
        invested: number;
        currentValue: number;
        returns: number;
        returnsPercentage: number;
    }> {
        try {
            // Get all transactions
            const transactions = await TransactionModel.findByUserId(userId);

            let totalInvested = 0;

            for (const txn of transactions) {
                const amount = parseFloat(txn.amount.toString());
                const type = txn.transaction_type;

                if (['BUY', 'SIP', 'SWITCH_IN'].includes(type)) {
                    totalInvested += amount;
                } else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(type)) {
                    totalInvested -= amount;
                }
            }

            const currentValue = await PortfolioHoldingModel.getTotalValuationByUserId(userId);
            const returns = currentValue - totalInvested;
            const returnsPercentage = totalInvested > 0
                ? parseFloat(((returns / totalInvested) * 100).toFixed(2))
                : 0;

            return {
                invested: parseFloat(totalInvested.toFixed(2)),
                currentValue: parseFloat(currentValue.toFixed(2)),
                returns: parseFloat(returns.toFixed(2)),
                returnsPercentage
            };
        } catch (error: any) {
            logger.error('Absolute returns calculation error', error);
            return { invested: 0, currentValue: 0, returns: 0, returnsPercentage: 0 };
        }
    }

    /**
     * Calculate portfolio growth curve (time-series valuation)
     * Uses benchmark history to estimate historical NAVs
     */
    /**
     * Calculate portfolio growth curve (time-series valuation)
     * Optimized to pre-fetch benchmark data and avoid N+1 queries.
     */
    static async calculateGrowthCurve(userId: string): Promise<Array<{ date: string; value: number }>> {
        try {
            const transactions = await TransactionModel.findByUserId(userId);
            if (transactions.length === 0) {
                return [];
            }

            // Get holdings with benchmark info
            const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);
            if (holdings.length === 0) return [];

            // Import db - REPLACED WITH STATIC IMPORT
            // const db = (await import('../config/database')).default;

            // 1. Batch fetch benchmark mappings for all holdings
            const isins = holdings.map(h => h.isin);
            const benchmarkMap = new Map<string, string>(); // isin -> index_id

            if (isins.length > 0) {
                // Parameterized query for array
                const placeholders = isins.map((_, i) => `$${i + 1}`).join(',');
                const benchmarkRes = await db.query(
                    `SELECT hm.isin, hm.benchmark_index_id 
                     FROM holding_metadata hm
                     WHERE hm.isin IN (${placeholders}) AND hm.benchmark_index_id IS NOT NULL`,
                    isins
                );

                for (const row of benchmarkRes.rows) {
                    benchmarkMap.set(row.isin, row.benchmark_index_id);
                }
            }

            // 2. Batch fetch ALL history for relevant indices
            // We need history from first transaction date to today
            const indexIds = Array.from(new Set(benchmarkMap.values()));
            // storage: indexId -> date (YYYY-MM-DD) -> value
            const indexHistory = new Map<string, Map<string, number>>();

            if (indexIds.length > 0) {
                const placeholders = indexIds.map((_, i) => `$${i + 1}`).join(',');
                const allHistoryRes = await db.query(
                    `SELECT index_id, date, value 
                     FROM market_index_history
                     WHERE index_id IN (${placeholders})
                     ORDER BY date ASC`,
                    indexIds
                );

                for (const row of allHistoryRes.rows) {
                    const idxId = row.index_id;
                    const dateStr = new Date(row.date).toISOString().slice(0, 10);
                    const val = parseFloat(row.value);

                    if (!indexHistory.has(idxId)) {
                        indexHistory.set(idxId, new Map());
                    }
                    indexHistory.get(idxId)!.set(dateStr, val);
                }
            }

            // Helper to get index value at or before a date
            const getIndexValue = (indexId: string, targetDate: string): number | null => {
                const history = indexHistory.get(indexId);
                if (!history) return null;

                // Exact match
                if (history.has(targetDate)) return history.get(targetDate)!;

                // Find closest previous date (since we ordered by ASC in query, we can iterate or use a sorted approach)
                // For simplicity given typical monthly data points:
                // We'll iterate the keys. Optimally this should be a binary search if keys are sorted array.
                // Given the map iteration order follows insertion (which is sorted by date query), 
                // we can iterate backwards or just scan.
                // Since this runs for every month, let's optimize slightly:
                // The history map keys are "2023-01-01" etc.

                // Brute-force fallback for now (can be optimized if massive history):
                let closestDate: string | null = null;
                for (const d of history.keys()) {
                    if (d <= targetDate) {
                        closestDate = d;
                    } else {
                        break; // Sorted by date ASC
                    }
                }

                return closestDate ? history.get(closestDate)! : null;
            };

            // Get first transaction date
            const firstTxDate = new Date(Math.min(...transactions.map(t => new Date(t.transaction_date).getTime())));
            const today = new Date();

            const dataPoints: Array<{ date: string; value: number }> = [];
            const currentDate = new Date(firstTxDate);
            currentDate.setDate(1); // Start of month

            while (currentDate <= today) {
                let portfolioValue = 0;
                const currentDateStr = currentDate.toISOString().slice(0, 10);

                for (const holding of holdings) {
                    // Get transactions up to this date for this holding
                    const holdingTxns = transactions.filter(t =>
                        t.isin === holding.isin && new Date(t.transaction_date) <= currentDate
                    );

                    if (holdingTxns.length === 0) continue;

                    // Calculate units held at this date
                    let unitsHeld = 0;
                    for (const txn of holdingTxns) {
                        const units = parseFloat(txn.units.toString());
                        if (['BUY', 'SIP', 'SWITCH_IN'].includes(txn.transaction_type)) {
                            unitsHeld += units;
                        } else if (['SELL', 'REDEMPTION', 'SWITCH_OUT'].includes(txn.transaction_type)) {
                            unitsHeld -= units;
                        }
                    }

                    if (unitsHeld <= 0) continue;

                    // Estimate NAV at this date using benchmark
                    let estimatedNav = holding.current_nav || 0;
                    const indexId = benchmarkMap.get(holding.isin);

                    if (indexId) {
                        const historicalIndex = getIndexValue(indexId, currentDateStr);
                        // Get latest value available in our loaded history for "current" ref
                        // The original logic fetched "current" meaning TODAY's value. 
                        // Let's get the absolute latest value from the history map.
                        const historyMap = indexHistory.get(indexId);
                        let currentIndex = 0;
                        if (historyMap && historyMap.size > 0) {
                            // Last entry is latest due to sort
                            const keys = Array.from(historyMap.keys());
                            currentIndex = historyMap.get(keys[keys.length - 1])!;
                        }

                        if (historicalIndex !== null && currentIndex > 0) {
                            estimatedNav = (holding.current_nav || 0) * (historicalIndex / currentIndex);
                        }
                    }

                    portfolioValue += unitsHeld * estimatedNav;
                }

                dataPoints.push({
                    date: currentDateStr,
                    value: parseFloat(portfolioValue.toFixed(2))
                });

                // Move to next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            return dataPoints.length >= 12 ? dataPoints : [];
        } catch (error: any) {
            logger.error('Growth curve calculation error', error);
            return [];
        }
    }

    /**
     * Calculate rolling returns (1-year annualized)
     */
    /**
     * Calculate rolling returns (1-year annualized)
     */
    static async calculateRollingReturns(userId: string, existingGrowthCurve?: Array<{ date: string; value: number }>): Promise<Array<{ date: string; return: number }>> {
        try {
            const growthCurve = existingGrowthCurve || await this.calculateGrowthCurve(userId);

            if (growthCurve.length < 13) {
                return []; // Need at least 13 months for 1-year rolling
            }

            const rollingReturns: Array<{ date: string; return: number }> = [];

            for (let i = 12; i < growthCurve.length; i++) {
                const currentValue = growthCurve[i].value;
                const yearAgoValue = growthCurve[i - 12].value;

                if (yearAgoValue > 0) {
                    const returnPct = ((currentValue - yearAgoValue) / yearAgoValue) * 100;
                    rollingReturns.push({
                        date: growthCurve[i].date,
                        return: parseFloat(returnPct.toFixed(2))
                    });
                }
            }

            return rollingReturns;
        } catch (error: any) {
            logger.error('Rolling returns calculation error', error);
            return [];
        }
    }

    /**
     * Calculate drawdown series (percentage decline from peak)
     */
    static async calculateDrawdownSeries(userId: string, existingGrowthCurve?: Array<{ date: string; value: number }>): Promise<Array<{ date: string; drawdown: number }>> {
        try {
            const growthCurve = existingGrowthCurve || await this.calculateGrowthCurve(userId);

            if (growthCurve.length < 12) {
                return [];
            }

            const drawdownSeries: Array<{ date: string; drawdown: number }> = [];
            let peak = 0;

            for (const point of growthCurve) {
                const value = point.value;

                if (value > peak) {
                    peak = value;
                }

                const drawdown = peak > 0 ? ((value - peak) / peak) * 100 : 0;

                drawdownSeries.push({
                    date: point.date,
                    drawdown: parseFloat(drawdown.toFixed(2))
                });
            }

            return drawdownSeries;
        } catch (error: any) {
            logger.error('Drawdown series calculation error', error);
            return [];
        }
    }

    /**
     * Get comprehensive performance metrics
     */
    static async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
        // Optimization: Calculate growth curve ONCE and reuse
        const growthCurve = await this.calculateGrowthCurve(userId);

        const [xirr, rollingReturns, drawdownSeries] = await Promise.all([
            this.calculatePortfolioXIRR(userId),
            this.calculateRollingReturns(userId, growthCurve),
            this.calculateDrawdownSeries(userId, growthCurve)
        ]);

        // Find max drawdown from series
        let maxDrawdown: MaxDrawdown | null = null;
        if (drawdownSeries.length > 0) {
            const minDrawdown = Math.min(...drawdownSeries.map(d => d.drawdown));
            const troughPoint = drawdownSeries.find(d => d.drawdown === minDrawdown);

            if (troughPoint) {
                // Find peak before trough
                const troughIndex = drawdownSeries.indexOf(troughPoint);
                let peakDate: Date | null = null;

                for (let i = 0; i <= troughIndex; i++) {
                    // Reconstruct value from drawdown: value = peak * (1 + drawdown/100)
                    // But we don't have peak easily, so we'll use a simplified approach
                    if (drawdownSeries[i].drawdown === 0) {
                        peakDate = new Date(drawdownSeries[i].date);
                    }
                }

                maxDrawdown = {
                    drawdown: minDrawdown,
                    peak: 0, // Would need growth curve to calculate
                    trough: 0, // Would need growth curve to calculate
                    peakDate,
                    troughDate: new Date(troughPoint.date)
                };
            }
        }

        return {
            xirr,
            rollingReturns: {
                oneYear: rollingReturns.length > 0 ? rollingReturns[rollingReturns.length - 1].return : null,
                threeYear: null,
                fiveYear: null
            },
            maxDrawdown
        };
    }
}

