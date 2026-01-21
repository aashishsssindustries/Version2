/**
 * Portfolio Analytics Types
 * Stateless computation types for portfolio analysis
 */

// ============ Input Types ============

export interface HoldingInput {
    isin: string;
    quantity: number;
    average_price?: number;
    last_valuation?: number;
    name?: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    category?: string; // e.g., 'Large Cap', 'Mid Cap', 'Small Cap', 'Debt', 'Hybrid'
    current_nav?: number;
}

// ============ Output Types ============

export interface PortfolioAnalyticsResult {
    totalValue: number;
    assetAllocation: AssetAllocation[];
    categoryExposure: CategoryExposure[];
    concentrationRisks: ConcentrationRisk[];
    holdingDetails: HoldingAnalysis[];
    summary: PortfolioSummary;
    computedAt: string;
}

export interface PortfolioSummary {
    totalHoldings: number;
    totalEquity: number;
    totalMutualFunds: number;
    largestHoldingPercentage: number;
    largestHoldingName: string;
    diversificationScore: number; // 0-100, higher = more diversified
}

export interface AssetAllocation {
    type: 'EQUITY' | 'MUTUAL_FUND';
    value: number;
    percentage: number;
    count: number;
}

export interface CategoryExposure {
    category: string;
    value: number;
    percentage: number;
    count: number;
}

export interface HoldingAnalysis {
    isin: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    category: string;
    quantity: number;
    currentValue: number;
    percentage: number;
    averagePrice?: number;
    currentNav?: number;
    gainLoss?: number;
    gainLossPercentage?: number;
}

export interface ConcentrationRisk {
    type: 'SINGLE_HOLDING' | 'CATEGORY' | 'ASSET_TYPE';
    identifier: string;
    percentage: number;
    threshold: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
}

// ============ Configuration ============

export interface ConcentrationThresholds {
    singleHoldingHigh: number;    // Default: 25%
    singleHoldingMedium: number;  // Default: 15%
    categoryHigh: number;         // Default: 50%
    categoryMedium: number;       // Default: 35%
    assetTypeHigh: number;        // Default: 90%
    assetTypeMedium: number;      // Default: 80%
}

export const DEFAULT_CONCENTRATION_THRESHOLDS: ConcentrationThresholds = {
    singleHoldingHigh: 25,
    singleHoldingMedium: 15,
    categoryHigh: 50,
    categoryMedium: 35,
    assetTypeHigh: 90,
    assetTypeMedium: 80,
};
