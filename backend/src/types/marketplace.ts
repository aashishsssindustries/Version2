export type ProductCategory = 'SIP' | 'Term Insurance' | 'Tax Saving' | 'Retirement' | 'General';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export type AssetClass = 'Equity' | 'Debt' | 'Hybrid' | 'Gold' | 'Insurance' | 'Other';

export interface Product {
    id: string;
    category: ProductCategory;
    name: string;
    description: string;
    riskLevel: RiskLevel;
    minInvestment?: number;
    returns?: string; // e.g., "12-15% p.a."
    tags: string[];
    suitablePersona?: string;
    // Discovery fields
    isin?: string;              // ISIN code for MFs/securities
    schemeCode?: string;        // AMC/AMFI scheme code
    fundHouse?: string;         // e.g., "HDFC AMC", "ICICI Prudential"
    assetClass?: AssetClass;    // Equity, Debt, Hybrid, etc.
    benchmark?: string;         // e.g., "Nifty 50", "Nifty Midcap 150"
    expenseRatio?: number;      // e.g., 0.5 (0.5%)
}

export interface ProductRecommendation extends Product {
    matchReason: string; // "Matches your Aggressive risk profile"
    relevanceScore: number; // For sorting
}

// Discovery types
export interface CatalogFilters {
    category?: ProductCategory;
    riskLevel?: RiskLevel;
    assetClass?: AssetClass;
    fundHouse?: string;
    minInvestmentMax?: number;
    tags?: string[];
}

export interface CategoryInfo {
    name: ProductCategory;
    count: number;
    description: string;
}

export interface FilterOptions {
    categories: ProductCategory[];
    riskLevels: RiskLevel[];
    assetClasses: AssetClass[];
    fundHouses: string[];
    tags: string[];
}

