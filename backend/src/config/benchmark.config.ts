/**
 * Benchmark indices configuration
 * Static mapping of fund categories to market indices with historical XIRR
 */

export interface BenchmarkIndex {
    index: string;
    staticXIRR: number; // 5-year historical average
}

export const CATEGORY_BENCHMARK_MAP: Record<string, BenchmarkIndex> = {
    'Large Cap': {
        index: 'NIFTY 50',
        staticXIRR: 12.0
    },
    'Mid Cap': {
        index: 'NIFTY Midcap 150',
        staticXIRR: 15.0
    },
    'Small Cap': {
        index: 'NIFTY Smallcap 250',
        staticXIRR: 18.0
    },
    'Debt': {
        index: 'CRISIL Composite Bond Fund Index',
        staticXIRR: 7.5
    },
    'Hybrid': {
        index: 'NIFTY Hybrid Index',
        staticXIRR: 10.0
    },
    'Equity': {
        index: 'NIFTY 500',
        staticXIRR: 13.0
    },
    // Fallback for unknown categories
    'Other': {
        index: 'NIFTY 500',
        staticXIRR: 13.0
    }
};

/**
 * Get benchmark index for a category
 */
export function getBenchmarkForCategory(category: string): BenchmarkIndex {
    return CATEGORY_BENCHMARK_MAP[category] || CATEGORY_BENCHMARK_MAP['Other'];
}
