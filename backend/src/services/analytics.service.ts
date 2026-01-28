import { PortfolioService } from './portfolio.service';
import { computePortfolioAnalytics } from './portfolioAnalytics.service';
import { PortfolioPerformanceService } from './portfolioPerformance.service';
import { BenchmarkService } from './benchmark.service';
import { PortfolioRiskService } from './portfolioRisk.service';
import { TransactionService } from './transaction.service';
import { HoldingInput } from '../types/portfolioAnalytics';
import logger from '../config/logger';

export class AnalyticsService {
    /**
     * Get comprehensive portfolio snapshot
     * Reusable by Controller and PDF Service
     */
    static async getPortfolioSnapshot(userId: string) {
        try {
            // Get holdings first to compute analytics
            const holdings = await PortfolioService.getHoldings(userId);

            // Transform holdings to analytics input
            const holdingInputs: HoldingInput[] = holdings.map(h => ({
                isin: h.isin,
                quantity: parseFloat(h.quantity as any) || 0,
                average_price: h.average_price ? parseFloat(h.average_price as any) : undefined,
                last_valuation: h.last_valuation ? parseFloat(h.last_valuation as any) : undefined,
                name: h.name,
                type: h.type as 'EQUITY' | 'MUTUAL_FUND',
                category: 'Equity', // Placeholder
                current_nav: h.current_nav ? parseFloat(h.current_nav as any) : undefined
            }));

            // Compute analytics
            const analytics = computePortfolioAnalytics(holdingInputs);

            // Aggregate all other analytics in parallel
            const [
                absoluteReturns,
                portfolioXIRR,
                benchmarkComparison,
                schemePerformances,
                riskMetrics,
                cashflowSummary,
                portfolioSummary,
                // New Analytics for V3 Report
                taxExposure,
                investmentBehavior,
                portfolioOverlap,
                yearlyCashflows
            ] = await Promise.all([
                PortfolioPerformanceService.calculateAbsoluteReturns(userId),
                PortfolioPerformanceService.calculatePortfolioXIRR(userId),
                BenchmarkService.compareWithBenchmark(userId),
                PortfolioPerformanceService.getSchemePerformances(userId),
                PortfolioRiskService.getPortfolioRiskMetrics(userId),
                TransactionService.aggregateCashflows(userId),
                PortfolioService.getPortfolioSummary(userId),
                // New Analytics for V3 Report
                AnalyticsService.calculateTaxExposure(userId),
                AnalyticsService.calculateInvestmentBehavior(userId),
                AnalyticsService.calculatePortfolioOverlap(userId),
                TransactionService.aggregateCashflowsByPeriod(userId)
            ]);

            // Process yearly cashflows for investment chart (Yearly net investment)
            const yearlyData = Object.values(yearlyCashflows.reduce((acc, curr) => {
                const year = curr.period.split('-')[0];
                if (!acc[year]) acc[year] = { year, amount: 0 };
                acc[year].amount += curr.net;
                return acc;
            }, {} as Record<string, { year: string; amount: number }>))
                .sort((a, b) => parseInt(a.year) - parseInt(b.year));

            return {
                summary: {
                    totalValue: absoluteReturns.currentValue,
                    invested: absoluteReturns.invested,
                    returns: absoluteReturns.returns,
                    returnsPercentage: absoluteReturns.returnsPercentage,
                    xirr: portfolioXIRR?.xirr || null,
                    holdingsCount: holdings.length
                },
                allocation: {
                    byAssetType: analytics.assetAllocation,
                    byCategory: analytics.categoryExposure,
                    topHoldings: analytics.holdingDetails
                        .sort((a: any, b: any) => b.value - a.value)
                        .slice(0, 5)
                        .map((h: any) => ({
                            isin: h.isin,
                            name: h.name,
                            value: h.currentValue,
                            weight: h.percentage
                        }))
                },
                performance: {
                    portfolioXIRR: portfolioXIRR,
                    absoluteReturns: {
                        invested: absoluteReturns.invested,
                        currentValue: absoluteReturns.currentValue,
                        returns: absoluteReturns.returns,
                        returnsPercentage: absoluteReturns.returnsPercentage
                    },
                    benchmarkComparison: benchmarkComparison,
                    schemePerformances: schemePerformances,
                    growth_curve: await PortfolioPerformanceService.calculateGrowthCurve(userId),
                    rolling_returns: await PortfolioPerformanceService.calculateRollingReturns(userId),
                    drawdown_series: await PortfolioPerformanceService.calculateDrawdownSeries(userId)
                },
                risk: {
                    volatility: riskMetrics.volatility,
                    concentrationRisk: riskMetrics.concentrationRisk,
                    diversificationFlag: riskMetrics.diversificationFlag,
                    riskReturnMatrix: riskMetrics.riskReturnMatrix,
                    concentrationFlags: analytics.concentrationRisks
                },
                cashflow: {
                    totalInflow: cashflowSummary.totalInflow,
                    totalOutflow: cashflowSummary.totalOutflow,
                    netCashflow: cashflowSummary.netCashflow,
                    transactionCount: cashflowSummary.transactionCount,
                    byType: cashflowSummary.byType
                },
                metadata: {
                    asOf: new Date(),
                    dataSources: ['MFAPI', 'Transactions', 'Holdings'],
                    computedAt: new Date(),
                    syncStatus: portfolioSummary.syncMetadata
                },
                // V3 Specific Fields
                taxAnalysis: {
                    ltcg: taxExposure.ltcg,
                    stcg: taxExposure.stcg,
                    equityPct: analytics.assetAllocation.find(a => a.type === 'EQUITY')?.percentage || 0,
                    debtPct: analytics.assetAllocation.find(a => a.type === 'MUTUAL_FUND')?.percentage || 0
                },
                behaviorAnalysis: {
                    churnRate: investmentBehavior.churnRate,
                    holdingPeriod: investmentBehavior.holdingPeriod,
                    concentration: riskMetrics.concentrationRisk.hasRisk ? 0.6 : 0.3
                },
                overlapAnalysis: portfolioOverlap,
                yearlyInvestments: { yearlyNetInvestments: yearlyData }
            };
        } catch (error: any) {
            logger.error('Analytics service snapshot error', error);
            throw new Error('Failed to generate portfolio snapshot');
        }
    }

    /**
     * Calculate Tax Exposure (Mock/Estimated)
     */
    private static async calculateTaxExposure(_userId: string) {
        // Logic to calculate tax based on holding period
        // For now returning estimates
        return { ltcg: 125000, stcg: 45000 };
    }

    /**
     * Calculate Investment Behavior
     */
    private static async calculateInvestmentBehavior(_userId: string) {
        // Logic for churn rate and holding period
        return { churnRate: 0.15, holdingPeriod: '2.5 Years' };
    }

    /**
     * Calculate Portfolio Overlap
     */
    private static async calculatePortfolioOverlap(_userId: string) {
        // Complex logic, returning mock for V3 demo
        return {
            overlapPercentage: 35,
            similarHoldings: [
                { schemes: ['Parag Parikh Flexi Cap', 'SBI Large Cap'], overlapPercentage: 45, commonHoldingsCount: 12 },
                { schemes: ['HDFC Mid Cap', 'Kotak Emerging'], overlapPercentage: 28, commonHoldingsCount: 8 }
            ]
        };
    }
}
