import { PortfolioHoldingModel } from '../models/portfolioHolding.model';
import { PortfolioPerformanceService } from './portfolioPerformance.service';
import { getBenchmarkForCategory } from '../config/benchmark.config';
import {
    BenchmarkComparison,
    CategoryWeight,
    SchemeBenchmarkComparison
} from '../types/benchmark.types';
import logger from '../config/logger';

export class BenchmarkService {
    /**
     * Calculate weighted benchmark XIRR based on portfolio composition
     */
    static async getPortfolioBenchmark(userId: string): Promise<{
        benchmarkXIRR: number;
        categoryBreakdown: CategoryWeight[];
    }> {
        try {
            // Get holdings with metadata (includes category)
            const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);
            const totalValue = await PortfolioHoldingModel.getTotalValuationByUserId(userId);

            if (totalValue === 0 || holdings.length === 0) {
                return {
                    benchmarkXIRR: 0,
                    categoryBreakdown: []
                };
            }

            // Group by category and calculate weights
            const categoryMap = new Map<string, number>();

            for (const holding of holdings) {
                // Get category from metadata - fallback to 'Other' if not available
                // Note: category field may not exist in current schema, using 'Equity' as default
                const category = 'Equity'; // Placeholder - would need category in holding_metadata
                const value = parseFloat(holding.last_valuation?.toString() || '0');

                const currentValue = categoryMap.get(category) || 0;
                categoryMap.set(category, currentValue + value);
            }

            // Calculate weighted benchmark XIRR
            let weightedBenchmarkXIRR = 0;
            const categoryBreakdown: CategoryWeight[] = [];

            for (const [category, value] of categoryMap.entries()) {
                const weight = (value / totalValue) * 100;
                const benchmark = getBenchmarkForCategory(category);

                weightedBenchmarkXIRR += (weight / 100) * benchmark.staticXIRR;

                categoryBreakdown.push({
                    category,
                    weight: parseFloat(weight.toFixed(2)),
                    benchmarkXIRR: benchmark.staticXIRR
                });
            }

            return {
                benchmarkXIRR: parseFloat(weightedBenchmarkXIRR.toFixed(2)),
                categoryBreakdown: categoryBreakdown.sort((a, b) => b.weight - a.weight)
            };
        } catch (error: any) {
            logger.error('Portfolio benchmark calculation error', error);
            return {
                benchmarkXIRR: 0,
                categoryBreakdown: []
            };
        }
    }

    /**
     * Compare portfolio performance with benchmark
     */
    static async compareWithBenchmark(userId: string): Promise<BenchmarkComparison | null> {
        try {
            // Get portfolio XIRR
            const portfolioXIRRResult = await PortfolioPerformanceService.calculatePortfolioXIRR(userId);

            if (!portfolioXIRRResult) {
                logger.warn(`No portfolio XIRR available for user ${userId}`);
                return null;
            }

            const portfolioXIRR = portfolioXIRRResult.xirr;

            // Get benchmark XIRR
            const { benchmarkXIRR, categoryBreakdown } = await this.getPortfolioBenchmark(userId);

            if (benchmarkXIRR === 0) {
                return null;
            }

            // Calculate outperformance
            const outperformance = parseFloat((portfolioXIRR - benchmarkXIRR).toFixed(2));

            // Determine relative performance
            let relativePerformance: 'Outperforming' | 'Matching' | 'Underperforming';
            let explanation: string;

            if (outperformance > 1) {
                relativePerformance = 'Outperforming';
                explanation = `Your portfolio is outperforming its benchmark by ${Math.abs(outperformance).toFixed(1)} percentage points. Portfolio XIRR: ${portfolioXIRR.toFixed(1)}%, Benchmark: ${benchmarkXIRR.toFixed(1)}%.`;
            } else if (outperformance < -1) {
                relativePerformance = 'Underperforming';
                explanation = `Your portfolio is underperforming its benchmark by ${Math.abs(outperformance).toFixed(1)} percentage points. Portfolio XIRR: ${portfolioXIRR.toFixed(1)}%, Benchmark: ${benchmarkXIRR.toFixed(1)}%. Consider reviewing your holdings.`;
            } else {
                relativePerformance = 'Matching';
                explanation = `Your portfolio is performing in line with its benchmark. Portfolio XIRR: ${portfolioXIRR.toFixed(1)}%, Benchmark: ${benchmarkXIRR.toFixed(1)}%.`;
            }

            return {
                portfolioXIRR,
                benchmarkXIRR,
                outperformance,
                relativePerformance,
                explanation,
                categoryBreakdown
            };
        } catch (error: any) {
            logger.error('Benchmark comparison error', error);
            return null;
        }
    }

    /**
     * Compare individual schemes with their benchmarks
     */
    static async compareSchemesBenchmark(userId: string): Promise<SchemeBenchmarkComparison[]> {
        try {
            const schemePerformances = await PortfolioPerformanceService.getSchemePerformances(userId);
            const comparisons: SchemeBenchmarkComparison[] = [];

            for (const scheme of schemePerformances) {
                // Use default category 'Equity' - would need actual category from metadata
                const category = 'Equity';
                const benchmark = getBenchmarkForCategory(category);
                const schemeXIRR = scheme.xirr?.xirr || 0;
                const outperformance = parseFloat((schemeXIRR - benchmark.staticXIRR).toFixed(2));

                let relativePerformance: 'Outperforming' | 'Matching' | 'Underperforming';
                if (outperformance > 1) {
                    relativePerformance = 'Outperforming';
                } else if (outperformance < -1) {
                    relativePerformance = 'Underperforming';
                } else {
                    relativePerformance = 'Matching';
                }

                comparisons.push({
                    isin: scheme.isin,
                    schemeName: scheme.schemeName,
                    category,
                    schemeXIRR,
                    benchmarkIndex: benchmark.index,
                    benchmarkXIRR: benchmark.staticXIRR,
                    outperformance,
                    relativePerformance
                });
            }

            return comparisons;
        } catch (error: any) {
            logger.error('Scheme benchmark comparison error', error);
            return [];
        }
    }
}
