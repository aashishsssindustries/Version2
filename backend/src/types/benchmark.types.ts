/**
 * Benchmark comparison type definitions
 */

export interface CategoryWeight {
    category: string;
    weight: number; // Percentage
    benchmarkXIRR: number;
}

export interface BenchmarkComparison {
    portfolioXIRR: number;
    benchmarkXIRR: number;
    outperformance: number; // Difference in percentage points
    relativePerformance: 'Outperforming' | 'Matching' | 'Underperforming';
    explanation: string;
    categoryBreakdown: CategoryWeight[];
}

export interface SchemeBenchmarkComparison {
    isin: string;
    schemeName: string;
    category: string;
    schemeXIRR: number;
    benchmarkIndex: string;
    benchmarkXIRR: number;
    outperformance: number;
    relativePerformance: 'Outperforming' | 'Matching' | 'Underperforming';
}
