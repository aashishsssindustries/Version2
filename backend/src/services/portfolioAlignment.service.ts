import { PortfolioHoldingModel, PortfolioHoldingWithMetadata } from '../models/portfolioHolding.model';

/**
 * Ideal allocation percentages by persona/risk class
 * Conservative bias: Lower equity exposure for each tier
 */
const IDEAL_ALLOCATIONS: Record<string, { equity: number; mutualFund: number; description: string }> = {
    // Risk Classes
    'Conservative': { equity: 20, mutualFund: 80, description: 'Stability-focused with minimal equity exposure' },
    'Moderate': { equity: 45, mutualFund: 55, description: 'Balanced growth with controlled risk' },
    'Aggressive': { equity: 70, mutualFund: 30, description: 'Growth-oriented with higher equity tolerance' },

    // Personas (mapped to similar risk levels with conservative bias)
    'Early Career Builder': { equity: 50, mutualFund: 50, description: 'Long horizon allows moderate equity' },
    'Mid-Career Optimizer': { equity: 40, mutualFund: 60, description: 'Balanced approach with debt focus' },
    'Pre-Retirement Planner': { equity: 25, mutualFund: 75, description: 'Capital preservation priority' },
    'Wealth Preserver': { equity: 15, mutualFund: 85, description: 'Minimal volatility exposure' },

    // Default fallback
    'General': { equity: 35, mutualFund: 65, description: 'Conservative balanced allocation' }
};

export interface AllocationBreakdown {
    equity: number;
    mutualFund: number;
    equityValue: number;
    mutualFundValue: number;
    totalValue: number;
}

export interface AdvisoryFlag {
    id: string;
    type: 'warning' | 'suggestion' | 'info';
    title: string;
    message: string;
    priority: number; // 1 = high, 2 = medium, 3 = low
}

export interface AlignmentResult {
    alignmentScore: number; // 0-100
    actualAllocation: AllocationBreakdown;
    idealAllocation: { equity: number; mutualFund: number };
    deviation: { equity: number; mutualFund: number };
    advisoryFlags: AdvisoryFlag[];
    persona: string;
    summary: string;
}

export class PortfolioAlignmentService {
    /**
     * Calculate actual allocation from holdings
     */
    static calculateActualAllocation(holdings: PortfolioHoldingWithMetadata[]): AllocationBreakdown {
        let equityValue = 0;
        let mutualFundValue = 0;

        for (const holding of holdings) {
            const value = parseFloat(holding.last_valuation?.toString() || '0');
            if (holding.type === 'EQUITY') {
                equityValue += value;
            } else {
                mutualFundValue += value;
            }
        }

        const totalValue = equityValue + mutualFundValue;

        return {
            equity: totalValue > 0 ? (equityValue / totalValue) * 100 : 0,
            mutualFund: totalValue > 0 ? (mutualFundValue / totalValue) * 100 : 0,
            equityValue,
            mutualFundValue,
            totalValue
        };
    }

    /**
     * Get ideal allocation for a persona/risk class
     */
    static getIdealAllocation(persona: string): { equity: number; mutualFund: number; description: string } {
        return IDEAL_ALLOCATIONS[persona] || IDEAL_ALLOCATIONS['General'];
    }

    /**
     * Calculate alignment score (0-100)
     * Score = 100 - weighted deviation
     */
    static calculateAlignmentScore(
        actual: AllocationBreakdown,
        ideal: { equity: number; mutualFund: number }
    ): number {
        // Calculate absolute deviations
        const equityDeviation = Math.abs(actual.equity - ideal.equity);
        const mutualFundDeviation = Math.abs(actual.mutualFund - ideal.mutualFund);

        // Average deviation (both should be equal due to 100% sum, but we average for robustness)
        const avgDeviation = (equityDeviation + mutualFundDeviation) / 2;

        // Score: 100 when perfectly aligned, 0 when completely off
        // Max possible deviation is 100 (e.g., 100% equity when ideal is 0%)
        const score = Math.max(0, 100 - avgDeviation);

        return Math.round(score);
    }

    /**
     * Generate advisory flags based on alignment analysis
     * All flags are computed, read-only, and explainable
     */
    static generateAdvisoryFlags(
        actual: AllocationBreakdown,
        ideal: { equity: number; mutualFund: number },
        persona: string,
        holdings?: PortfolioHoldingWithMetadata[]
    ): AdvisoryFlag[] {
        const flags: AdvisoryFlag[] = [];
        const equityDeviation = actual.equity - ideal.equity;
        const debtDeviation = actual.mutualFund - ideal.mutualFund;
        const threshold = 10; // 10% tolerance

        // === FLAG 1: Equity Overweight ===
        if (equityDeviation > threshold) {
            flags.push({
                id: 'equity_overweight',
                type: 'warning',
                title: `Equity Overweight by ${equityDeviation.toFixed(1)}%`,
                message: `Your equity allocation is ${actual.equity.toFixed(1)}% vs recommended ${ideal.equity}% for your ${persona} profile. This exposes you to higher volatility. Consider shifting ${equityDeviation.toFixed(1)}% toward debt instruments for better risk management.`,
                priority: 1
            });
        }

        // === FLAG 2: Underallocated to Debt ===
        if (debtDeviation < -threshold) {
            const underallocation = Math.abs(debtDeviation);
            flags.push({
                id: 'underallocated_to_debt',
                type: 'warning',
                title: `Underallocated to Debt by ${underallocation.toFixed(1)}%`,
                message: `Your debt/mutual fund allocation is ${actual.mutualFund.toFixed(1)}% vs recommended ${ideal.mutualFund}% for your ${persona} profile. Increasing debt exposure can provide stability and regular income.`,
                priority: 1
            });
        }

        // === FLAG 3: High Concentration Risk ===
        if (holdings && holdings.length > 0) {
            // Check for single holding concentration
            const sortedByValue = [...holdings]
                .map(h => ({ name: h.name, value: h.last_valuation || 0 }))
                .sort((a, b) => b.value - a.value);

            if (sortedByValue.length > 0 && actual.totalValue > 0) {
                const topHoldingPct = (sortedByValue[0].value / actual.totalValue) * 100;
                const top3Value = sortedByValue.slice(0, 3).reduce((sum, h) => sum + h.value, 0);
                const top3Pct = (top3Value / actual.totalValue) * 100;

                // Flag if single holding > 40% or top 3 > 70%
                if (topHoldingPct > 40) {
                    flags.push({
                        id: 'high_concentration_risk',
                        type: 'warning',
                        title: 'High Concentration Risk',
                        message: `"${sortedByValue[0].name}" represents ${topHoldingPct.toFixed(1)}% of your portfolio. A single holding above 40% creates significant concentration risk. Consider diversifying across more instruments.`,
                        priority: 1
                    });
                } else if (top3Pct > 70 && holdings.length >= 5) {
                    flags.push({
                        id: 'high_concentration_risk',
                        type: 'suggestion',
                        title: 'High Concentration Risk',
                        message: `Your top 3 holdings represent ${top3Pct.toFixed(1)}% of your portfolio. Consider spreading investments more evenly to reduce concentration risk.`,
                        priority: 2
                    });
                }
            }
        }

        // === FLAG 4: Low Diversification ===
        // Check if portfolio is heavily concentrated in one asset type
        if (actual.equity >= 90 || actual.mutualFund >= 90) {
            const dominantType = actual.equity >= 90 ? 'equity' : 'mutual funds/debt';
            flags.push({
                id: 'low_diversification',
                type: 'warning',
                title: 'Low Diversification',
                message: `Your portfolio is ${Math.max(actual.equity, actual.mutualFund).toFixed(1)}% in ${dominantType}. Such concentration increases risk. Aim for a balanced mix aligned with your ${persona} profile.`,
                priority: 1
            });
        } else if ((holdings?.length || 0) < 3 && actual.totalValue > 0) {
            flags.push({
                id: 'low_diversification',
                type: 'suggestion',
                title: 'Low Diversification',
                message: `With only ${holdings?.length || 0} holding(s), your portfolio lacks diversification. Consider adding more instruments across different sectors and asset types.`,
                priority: 2
            });
        }

        // Under-exposed to equity (less urgent, growth opportunity)
        if (equityDeviation < -threshold && actual.totalValue > 0) {
            flags.push({
                id: 'equity_underweight',
                type: 'suggestion',
                title: 'Equity Underweight',
                message: `Your equity allocation (${actual.equity.toFixed(1)}%) is ${Math.abs(equityDeviation).toFixed(1)}% below the recommended ${ideal.equity}% for your ${persona} profile. You may be missing growth opportunities.`,
                priority: 2
            });
        }

        // No holdings info
        if (actual.totalValue === 0) {
            flags.push({
                id: 'empty_portfolio',
                type: 'info',
                title: 'Empty Portfolio',
                message: 'Add holdings to your portfolio to see alignment analysis and personalized recommendations.',
                priority: 3
            });
        }

        // Perfect or near-perfect alignment - positive reinforcement
        if (Math.abs(equityDeviation) <= 5 && actual.totalValue > 0) {
            flags.push({
                id: 'well_aligned',
                type: 'info',
                title: 'Well Aligned',
                message: `Your portfolio allocation closely matches the recommended allocation for your ${persona} profile. Great job maintaining discipline!`,
                priority: 3
            });
        }

        // Sort by priority (1 = highest priority)
        return flags.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Generate summary text
     */
    static generateSummary(score: number, persona: string): string {
        if (score >= 90) {
            return `Excellent alignment with your ${persona} profile. Your portfolio is well-positioned for your risk tolerance.`;
        } else if (score >= 70) {
            return `Good alignment with your ${persona} profile. Minor adjustments could optimize your risk-return balance.`;
        } else if (score >= 50) {
            return `Moderate alignment with your ${persona} profile. Consider rebalancing to better match your risk tolerance.`;
        } else {
            return `Low alignment with your ${persona} profile. Significant rebalancing is recommended to align with your risk preferences.`;
        }
    }

    /**
     * Main analysis function: Calculate full alignment result
     */
    static async analyzeAlignment(userId: string, persona: string, riskClass?: string): Promise<AlignmentResult> {
        // Fetch user holdings
        const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);

        // Determine which profile to use (prefer persona, fallback to riskClass)
        const profileKey = persona || riskClass || 'General';

        // Calculate allocations
        const actualAllocation = this.calculateActualAllocation(holdings);
        const idealAllocationData = this.getIdealAllocation(profileKey);
        const idealAllocation = { equity: idealAllocationData.equity, mutualFund: idealAllocationData.mutualFund };

        // Calculate score
        const alignmentScore = this.calculateAlignmentScore(actualAllocation, idealAllocation);

        // Calculate deviations
        const deviation = {
            equity: actualAllocation.equity - idealAllocation.equity,
            mutualFund: actualAllocation.mutualFund - idealAllocation.mutualFund
        };

        // Generate flags (pass holdings for concentration analysis)
        const advisoryFlags = this.generateAdvisoryFlags(actualAllocation, idealAllocation, profileKey, holdings);

        // Generate summary
        const summary = this.generateSummary(alignmentScore, profileKey);

        return {
            alignmentScore,
            actualAllocation,
            idealAllocation,
            deviation,
            advisoryFlags,
            persona: profileKey,
            summary
        };
    }

    /**
     * Synchronous analysis when holdings are already available
     */
    static analyzeHoldings(
        holdings: PortfolioHoldingWithMetadata[],
        persona: string,
        riskClass?: string
    ): AlignmentResult {
        const profileKey = persona || riskClass || 'General';
        const actualAllocation = this.calculateActualAllocation(holdings);
        const idealAllocationData = this.getIdealAllocation(profileKey);
        const idealAllocation = { equity: idealAllocationData.equity, mutualFund: idealAllocationData.mutualFund };
        const alignmentScore = this.calculateAlignmentScore(actualAllocation, idealAllocation);
        const deviation = {
            equity: actualAllocation.equity - idealAllocation.equity,
            mutualFund: actualAllocation.mutualFund - idealAllocation.mutualFund
        };
        const advisoryFlags = this.generateAdvisoryFlags(actualAllocation, idealAllocation, profileKey, holdings);
        const summary = this.generateSummary(alignmentScore, profileKey);

        return {
            alignmentScore,
            actualAllocation,
            idealAllocation,
            deviation,
            advisoryFlags,
            persona: profileKey,
            summary
        };
    }
}
