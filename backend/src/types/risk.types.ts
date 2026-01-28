/**
 * Portfolio risk analytics type definitions
 */

export interface VolatilityResult {
    value: number; // Percentage
    category: 'Low' | 'Medium' | 'High';
    explanation: string;
}

export interface ConcentrationRisk {
    hasRisk: boolean;
    topHoldings: Array<{
        isin: string;
        name: string;
        weight: number; // Percentage
        value: number;
    }>;
    explanation: string;
    severity: 'None' | 'Moderate' | 'High';
}

export interface DiversificationFlag {
    isOverDiversified: boolean;
    totalHoldings: number;
    smallHoldingsCount: number; // Holdings < 5%
    smallHoldingsPercentage: number;
    explanation: string;
}

export interface RiskReturnQuadrant {
    isin: string;
    name: string;
    return: number; // Percentage (XIRR)
    risk: number; // Volatility percentage
    weight: number; // Portfolio weight percentage
    quadrant: 'HighReturn-LowRisk' | 'HighReturn-HighRisk' |
    'LowReturn-LowRisk' | 'LowReturn-HighRisk';
}

export interface PortfolioRiskMetrics {
    volatility: VolatilityResult;
    concentrationRisk: ConcentrationRisk;
    diversificationFlag: DiversificationFlag;
    riskReturnMatrix: RiskReturnQuadrant[];
}

export interface HoldingWeight {
    isin: string;
    name: string;
    value: number;
    weight: number; // Percentage
}
