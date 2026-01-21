/**
 * Portfolio Analytics Computation Engine
 * 
 * Stateless computation service for portfolio analysis.
 * All functions are pure and can be reused across reports, APIs, and services.
 */

import {
    HoldingInput,
    PortfolioAnalyticsResult,
    AssetAllocation,
    CategoryExposure,
    HoldingAnalysis,
    ConcentrationRisk,
    PortfolioSummary,
    ConcentrationThresholds,
    DEFAULT_CONCENTRATION_THRESHOLDS
} from '../types/portfolioAnalytics';

/**
 * Main entry point - compute full portfolio analytics
 */
export function computePortfolioAnalytics(
    holdings: HoldingInput[],
    thresholds: ConcentrationThresholds = DEFAULT_CONCENTRATION_THRESHOLDS
): PortfolioAnalyticsResult {
    // Handle empty portfolio
    if (!holdings || holdings.length === 0) {
        return {
            totalValue: 0,
            assetAllocation: [],
            categoryExposure: [],
            concentrationRisks: [],
            holdingDetails: [],
            summary: {
                totalHoldings: 0,
                totalEquity: 0,
                totalMutualFunds: 0,
                largestHoldingPercentage: 0,
                largestHoldingName: '',
                diversificationScore: 0
            },
            computedAt: new Date().toISOString()
        };
    }

    // Calculate holding values
    const holdingDetails = calculateHoldingDetails(holdings);
    const totalValue = calculateTotalValue(holdingDetails);

    // Calculate allocations
    const assetAllocation = calculateAssetAllocation(holdingDetails, totalValue);
    const categoryExposure = calculateCategoryExposure(holdingDetails, totalValue);

    // Detect concentration risks
    const concentrationRisks = detectConcentrationRisks(
        holdingDetails,
        assetAllocation,
        categoryExposure,
        totalValue,
        thresholds
    );

    // Generate summary
    const summary = generateSummary(holdingDetails, totalValue, concentrationRisks);

    return {
        totalValue,
        assetAllocation,
        categoryExposure,
        concentrationRisks,
        holdingDetails,
        summary,
        computedAt: new Date().toISOString()
    };
}

/**
 * Calculate individual holding details with values and percentages
 */
export function calculateHoldingDetails(holdings: HoldingInput[]): HoldingAnalysis[] {
    return holdings.map(holding => {
        // Priority: last_valuation > (quantity * current_nav) > (quantity * average_price) > 0
        let currentValue = 0;

        if (holding.last_valuation && holding.last_valuation > 0) {
            currentValue = holding.last_valuation;
        } else if (holding.current_nav && holding.quantity) {
            currentValue = holding.quantity * holding.current_nav;
        } else if (holding.average_price && holding.quantity) {
            currentValue = holding.quantity * holding.average_price;
        }

        // Calculate gain/loss if we have average_price
        let gainLoss: number | undefined;
        let gainLossPercentage: number | undefined;

        if (holding.average_price && holding.average_price > 0 && currentValue > 0) {
            const investedValue = holding.quantity * holding.average_price;
            gainLoss = currentValue - investedValue;
            gainLossPercentage = ((currentValue - investedValue) / investedValue) * 100;
        }

        return {
            isin: holding.isin,
            name: holding.name || holding.isin,
            type: holding.type,
            category: holding.category || 'Uncategorized',
            quantity: holding.quantity,
            currentValue,
            percentage: 0, // Will be calculated after total is known
            averagePrice: holding.average_price,
            currentNav: holding.current_nav,
            gainLoss,
            gainLossPercentage
        };
    });
}

/**
 * Calculate total portfolio value
 */
export function calculateTotalValue(holdings: HoldingAnalysis[]): number {
    return holdings.reduce((sum, h) => sum + h.currentValue, 0);
}

/**
 * Update holding percentages after total is calculated
 */
function updatePercentages(holdings: HoldingAnalysis[], totalValue: number): void {
    if (totalValue === 0) return;

    holdings.forEach(h => {
        h.percentage = (h.currentValue / totalValue) * 100;
    });
}

/**
 * Calculate asset allocation by type (EQUITY vs MUTUAL_FUND)
 */
export function calculateAssetAllocation(
    holdings: HoldingAnalysis[],
    totalValue: number
): AssetAllocation[] {
    // Update percentages first
    updatePercentages(holdings, totalValue);

    const typeMap = new Map<'EQUITY' | 'MUTUAL_FUND', { value: number; count: number }>();

    holdings.forEach(h => {
        const existing = typeMap.get(h.type) || { value: 0, count: 0 };
        typeMap.set(h.type, {
            value: existing.value + h.currentValue,
            count: existing.count + 1
        });
    });

    const allocation: AssetAllocation[] = [];

    typeMap.forEach((data, type) => {
        allocation.push({
            type,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            count: data.count
        });
    });

    // Sort by value descending
    return allocation.sort((a, b) => b.value - a.value);
}

/**
 * Calculate category exposure (Large Cap, Mid Cap, etc.)
 */
export function calculateCategoryExposure(
    holdings: HoldingAnalysis[],
    totalValue: number
): CategoryExposure[] {
    const categoryMap = new Map<string, { value: number; count: number }>();

    holdings.forEach(h => {
        const category = h.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { value: 0, count: 0 };
        categoryMap.set(category, {
            value: existing.value + h.currentValue,
            count: existing.count + 1
        });
    });

    const exposure: CategoryExposure[] = [];

    categoryMap.forEach((data, category) => {
        exposure.push({
            category,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            count: data.count
        });
    });

    // Sort by value descending
    return exposure.sort((a, b) => b.value - a.value);
}

/**
 * Detect concentration risks in portfolio
 */
export function detectConcentrationRisks(
    holdings: HoldingAnalysis[],
    assetAllocation: AssetAllocation[],
    categoryExposure: CategoryExposure[],
    totalValue: number,
    thresholds: ConcentrationThresholds
): ConcentrationRisk[] {
    const risks: ConcentrationRisk[] = [];

    if (totalValue === 0) return risks;

    // 1. Check single holding concentration
    holdings.forEach(h => {
        const percentage = (h.currentValue / totalValue) * 100;

        if (percentage >= thresholds.singleHoldingHigh) {
            risks.push({
                type: 'SINGLE_HOLDING',
                identifier: h.name,
                percentage: Math.round(percentage * 100) / 100,
                threshold: thresholds.singleHoldingHigh,
                severity: 'HIGH',
                message: `${h.name} represents ${percentage.toFixed(1)}% of your portfolio. Consider reducing exposure below ${thresholds.singleHoldingHigh}%.`
            });
        } else if (percentage >= thresholds.singleHoldingMedium) {
            risks.push({
                type: 'SINGLE_HOLDING',
                identifier: h.name,
                percentage: Math.round(percentage * 100) / 100,
                threshold: thresholds.singleHoldingMedium,
                severity: 'MEDIUM',
                message: `${h.name} at ${percentage.toFixed(1)}% is approaching concentration limits.`
            });
        }
    });

    // 2. Check category concentration
    categoryExposure.forEach(cat => {
        if (cat.percentage >= thresholds.categoryHigh) {
            risks.push({
                type: 'CATEGORY',
                identifier: cat.category,
                percentage: Math.round(cat.percentage * 100) / 100,
                threshold: thresholds.categoryHigh,
                severity: 'HIGH',
                message: `${cat.category} category at ${cat.percentage.toFixed(1)}% exceeds recommended ${thresholds.categoryHigh}% limit.`
            });
        } else if (cat.percentage >= thresholds.categoryMedium) {
            risks.push({
                type: 'CATEGORY',
                identifier: cat.category,
                percentage: Math.round(cat.percentage * 100) / 100,
                threshold: thresholds.categoryMedium,
                severity: 'MEDIUM',
                message: `${cat.category} allocation at ${cat.percentage.toFixed(1)}% is relatively high.`
            });
        }
    });

    // 3. Check asset type concentration
    assetAllocation.forEach(alloc => {
        if (alloc.percentage >= thresholds.assetTypeHigh) {
            risks.push({
                type: 'ASSET_TYPE',
                identifier: alloc.type,
                percentage: Math.round(alloc.percentage * 100) / 100,
                threshold: thresholds.assetTypeHigh,
                severity: 'HIGH',
                message: `Portfolio is ${alloc.percentage.toFixed(1)}% in ${alloc.type}. Consider diversifying across asset types.`
            });
        } else if (alloc.percentage >= thresholds.assetTypeMedium) {
            risks.push({
                type: 'ASSET_TYPE',
                identifier: alloc.type,
                percentage: Math.round(alloc.percentage * 100) / 100,
                threshold: thresholds.assetTypeMedium,
                severity: 'MEDIUM',
                message: `${alloc.type} at ${alloc.percentage.toFixed(1)}% represents significant portfolio weight.`
            });
        }
    });

    // Sort by severity: HIGH > MEDIUM > LOW
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Generate portfolio summary
 */
export function generateSummary(
    holdings: HoldingAnalysis[],
    totalValue: number,
    risks: ConcentrationRisk[]
): PortfolioSummary {
    const equityHoldings = holdings.filter(h => h.type === 'EQUITY');
    const mfHoldings = holdings.filter(h => h.type === 'MUTUAL_FUND');

    // Find largest holding
    let largestHolding = holdings[0] || { name: '', percentage: 0 };
    holdings.forEach(h => {
        if (h.currentValue > (largestHolding.currentValue || 0)) {
            largestHolding = h;
        }
    });

    const largestPercentage = totalValue > 0
        ? (largestHolding.currentValue / totalValue) * 100
        : 0;

    // Calculate diversification score (0-100)
    // Based on: number of holdings, spread across types/categories, lack of concentration risks
    const diversificationScore = calculateDiversificationScore(holdings, risks, totalValue);

    return {
        totalHoldings: holdings.length,
        totalEquity: equityHoldings.length,
        totalMutualFunds: mfHoldings.length,
        largestHoldingPercentage: Math.round(largestPercentage * 100) / 100,
        largestHoldingName: largestHolding.name || '',
        diversificationScore
    };
}

/**
 * Calculate diversification score (0-100)
 */
function calculateDiversificationScore(
    holdings: HoldingAnalysis[],
    risks: ConcentrationRisk[],
    totalValue: number
): number {
    if (holdings.length === 0 || totalValue === 0) return 0;

    let score = 100;

    // Penalize for fewer holdings (ideal: 10-20)
    if (holdings.length < 5) {
        score -= 30;
    } else if (holdings.length < 10) {
        score -= 15;
    } else if (holdings.length > 30) {
        // Too many can also be problematic (over-diversification)
        score -= 5;
    }

    // Penalize for concentration risks
    risks.forEach(risk => {
        if (risk.severity === 'HIGH') {
            score -= 20;
        } else if (risk.severity === 'MEDIUM') {
            score -= 10;
        }
    });

    // Calculate Herfindahl-Hirschman Index (HHI) for concentration
    // Lower HHI = more diversified
    const hhi = holdings.reduce((sum, h) => {
        const weight = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
        return sum + (weight * weight);
    }, 0);

    // HHI interpretation: 
    // < 1500 = competitive/diversified
    // 1500-2500 = moderately concentrated
    // > 2500 = highly concentrated
    if (hhi > 2500) {
        score -= 25;
    } else if (hhi > 1500) {
        score -= 10;
    }

    // Ensure score is within 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Utility: Format currency value
 */
export function formatCurrency(value: number, locale: string = 'en-IN'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Utility: Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}
