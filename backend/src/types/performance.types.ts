/**
 * Performance analytics type definitions
 */

export interface XIRRResult {
    xirr: number; // Annualized percentage (e.g., 12.5 = 12.5%)
    invested: number;
    currentValue: number;
    absoluteReturn: number; // Percentage
    absoluteReturnAmount: number; // Rupees
}

export interface RollingReturns {
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
}

export interface MaxDrawdown {
    drawdown: number; // Percentage
    peak: number;
    trough: number;
    peakDate: Date | null;
    troughDate: Date | null;
}

export interface PerformanceMetrics {
    xirr: XIRRResult | null;
    rollingReturns: RollingReturns;
    maxDrawdown: MaxDrawdown | null;
}

export interface SchemePerformance {
    isin: string;
    schemeName: string;
    xirr: XIRRResult | null;
    absoluteReturn: number | null;
    invested: number;
    currentValue: number;
}

export interface NAVDataPoint {
    date: Date;
    nav: number;
}
