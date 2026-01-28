import { PortfolioHoldingModel } from '../models/portfolioHolding.model';
import { PortfolioPerformanceService } from './portfolioPerformance.service';
import {
    VolatilityResult,
    ConcentrationRisk,
    DiversificationFlag,
    RiskReturnQuadrant,
    PortfolioRiskMetrics,
    HoldingWeight
} from '../types/risk.types';
import logger from '../config/logger';

export class PortfolioRiskService {
    /**
     * Calculate portfolio weights for all holdings
     */
    static async calculatePortfolioWeights(userId: string): Promise<HoldingWeight[]> {
        const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);
        const totalValue = await PortfolioHoldingModel.getTotalValuationByUserId(userId);

        if (totalValue === 0) {
            return [];
        }

        return holdings.map(h => {
            const value = parseFloat(h.last_valuation?.toString() || '0');
            const weight = (value / totalValue) * 100;

            return {
                isin: h.isin,
                name: h.name,
                value: parseFloat(value.toFixed(2)),
                weight: parseFloat(weight.toFixed(2))
            };
        }).sort((a, b) => b.weight - a.weight); // Sort by weight descending
    }

    /**
     * Detect concentration risk
     * Flags if single holding > 25% or top 3 > 50%
     */
    static async detectConcentrationRisk(userId: string): Promise<ConcentrationRisk> {
        const weights = await this.calculatePortfolioWeights(userId);

        if (weights.length === 0) {
            return {
                hasRisk: false,
                topHoldings: [],
                explanation: 'No holdings in portfolio',
                severity: 'None'
            };
        }

        const top3 = weights.slice(0, 3);
        const top3Weight = top3.reduce((sum, h) => sum + h.weight, 0);
        const topHolding = weights[0];

        let hasRisk = false;
        let severity: 'None' | 'Moderate' | 'High' = 'None';
        let explanation = '';

        // Single holding > 25%
        if (topHolding.weight > 25) {
            hasRisk = true;
            severity = topHolding.weight > 40 ? 'High' : 'Moderate';
            explanation = `High concentration risk: ${topHolding.name} accounts for ${topHolding.weight.toFixed(1)}% of your portfolio. Consider diversifying to reduce risk.`;
        }
        // Top 3 holdings > 50%
        else if (top3Weight > 50 && weights.length > 3) {
            hasRisk = true;
            severity = 'Moderate';
            const names = top3.map(h => h.name).join(', ');
            explanation = `Moderate concentration risk: Top 3 holdings (${names}) account for ${top3Weight.toFixed(1)}% of your portfolio.`;
        }
        else {
            explanation = 'Portfolio concentration is within healthy limits.';
        }

        return {
            hasRisk,
            topHoldings: top3,
            explanation,
            severity
        };
    }

    /**
     * Detect over-diversification
     * Flags if > 15 holdings with many small positions
     */
    static async detectOverDiversification(userId: string): Promise<DiversificationFlag> {
        const weights = await this.calculatePortfolioWeights(userId);

        if (weights.length === 0) {
            return {
                isOverDiversified: false,
                totalHoldings: 0,
                smallHoldingsCount: 0,
                smallHoldingsPercentage: 0,
                explanation: 'No holdings in portfolio'
            };
        }

        const smallHoldings = weights.filter(h => h.weight < 5);
        const smallHoldingsPercentage = (smallHoldings.length / weights.length) * 100;

        let isOverDiversified = false;
        let explanation = '';

        // Over-diversified if > 15 holdings AND > 50% are small positions
        if (weights.length > 15 && smallHoldingsPercentage > 50) {
            isOverDiversified = true;
            explanation = `Portfolio may be over-diversified with ${weights.length} holdings, where ${smallHoldings.length} holdings are less than 5% each. Consider consolidating smaller positions to improve portfolio management and potential returns.`;
        }
        // Many holdings but reasonable sizes
        else if (weights.length > 15) {
            explanation = `Portfolio has ${weights.length} holdings. Consider reviewing if all positions add meaningful value.`;
        }
        // Reasonable diversification
        else if (weights.length >= 8 && weights.length <= 15) {
            explanation = `Portfolio has healthy diversification with ${weights.length} holdings.`;
        }
        // Under-diversified
        else if (weights.length < 8) {
            explanation = `Portfolio has ${weights.length} holdings. Consider adding more holdings to improve diversification if risk tolerance allows.`;
        }

        return {
            isOverDiversified,
            totalHoldings: weights.length,
            smallHoldingsCount: smallHoldings.length,
            smallHoldingsPercentage: parseFloat(smallHoldingsPercentage.toFixed(1)),
            explanation
        };
    }

    /**
     * Calculate portfolio volatility
     * NOTE: Placeholder - real implementation needs historical price data
     */
    static async calculateVolatility(_userId: string): Promise<VolatilityResult> {
        // Placeholder implementation
        // Real implementation would:
        // 1. Fetch historical NAV/price data for each holding
        // 2. Calculate daily/monthly returns
        // 3. Compute weighted standard deviation
        // 4. Annualize the volatility

        logger.info('Volatility calculation - placeholder (needs historical price data)');

        return {
            value: 0,
            category: 'Medium',
            explanation: 'Volatility calculation requires historical price data. This is a placeholder.'
        };
    }

    /**
     * Infer category from holding metadata
     * @private
     */
    private static inferCategory(holding: any): string {
        const desc = (holding.description || '').toLowerCase();
        const name = (holding.name || '').toLowerCase();

        // Check description and name for category keywords
        if (desc.includes('large cap') || name.includes('large cap') || name.includes('top 100')) {
            return 'Large Cap';
        }
        if (desc.includes('mid cap') || name.includes('mid cap') || name.includes('midcap')) {
            return 'Mid Cap';
        }
        if (desc.includes('small cap') || name.includes('small cap') || name.includes('smallcap')) {
            return 'Small Cap';
        }
        if (desc.includes('elss') || name.includes('elss') || desc.includes('tax saver') || name.includes('tax saver')) {
            return 'ELSS';
        }
        if (desc.includes('hybrid') || name.includes('hybrid') || desc.includes('balanced') || name.includes('balanced')) {
            return 'Hybrid';
        }
        if (desc.includes('debt') || name.includes('debt') || desc.includes('bond') || name.includes('bond')) {
            return 'Debt';
        }

        // Check type for equities
        if (holding.type === 'EQUITY') {
            return 'EQUITY';
        }

        // Default to Large Cap for unknown mutual funds
        return 'Large Cap';
    }

    /**
     * Generate risk-return matrix
     * Maps each holding to risk/return quadrant
     */
    static async generateRiskReturnMatrix(userId: string): Promise<RiskReturnQuadrant[]> {
        try {
            const weights = await this.calculatePortfolioWeights(userId);
            const schemePerformances = await PortfolioPerformanceService.getSchemePerformances(userId);

            const matrix: RiskReturnQuadrant[] = [];

            // Volatility mapping by category (annualized standard deviation %)
            const volatilityMap: Record<string, number> = {
                'Large Cap': 15,      // Lower volatility blue-chip stocks
                'Mid Cap': 22,        // Higher volatility growth stocks
                'Small Cap': 28,      // Highest volatility small companies
                'ELSS': 18,          // Tax-saving equity funds
                'Hybrid': 10,        // Balanced funds (equity + debt)
                'Debt': 5,           // Lowest volatility fixed income
                'EQUITY': 20         // Direct equity stocks (moderate-high)
            };

            for (const weight of weights) {
                const performance = schemePerformances.find(p => p.isin === weight.isin);
                const returnValue = performance?.xirr?.xirr || 0;

                // Get realistic risk based on category
                const category = this.inferCategory(weight);
                const riskValue = volatilityMap[category] || 15;

                // Determine quadrant based on return and risk thresholds
                let quadrant: RiskReturnQuadrant['quadrant'];
                const isHighReturn = returnValue > 10;  // 10% XIRR threshold
                const isHighRisk = riskValue > 15;      // 15% volatility threshold

                if (isHighReturn && !isHighRisk) {
                    quadrant = 'HighReturn-LowRisk';
                } else if (isHighReturn && isHighRisk) {
                    quadrant = 'HighReturn-HighRisk';
                } else if (!isHighReturn && !isHighRisk) {
                    quadrant = 'LowReturn-LowRisk';
                } else {
                    quadrant = 'LowReturn-HighRisk';
                }

                matrix.push({
                    isin: weight.isin,
                    name: weight.name,
                    return: returnValue,
                    risk: riskValue,
                    weight: weight.weight,
                    quadrant
                });
            }

            return matrix;
        } catch (error: any) {
            logger.error('Risk-return matrix generation error', error);
            return [];
        }
    }

    /**
     * Get comprehensive portfolio risk metrics
     */
    static async getPortfolioRiskMetrics(userId: string): Promise<PortfolioRiskMetrics> {
        const [volatility, concentrationRisk, diversificationFlag, riskReturnMatrix] = await Promise.all([
            this.calculateVolatility(userId),
            this.detectConcentrationRisk(userId),
            this.detectOverDiversification(userId),
            this.generateRiskReturnMatrix(userId)
        ]);

        return {
            volatility,
            concentrationRisk,
            diversificationFlag,
            riskReturnMatrix
        };
    }
}
