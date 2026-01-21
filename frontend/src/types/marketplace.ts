export type ProductCategory = 'SIP' | 'Term Insurance' | 'Tax Saving' | 'Retirement' | 'General';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export type AssetClass = 'Equity' | 'Debt' | 'Hybrid' | 'Gold' | 'Insurance' | 'Other';

export interface Product {
    id: string;
    category: ProductCategory;
    name: string;
    description: string;
    riskLevel: RiskLevel;
    minInvestment: number;
    returns: string;
    tags: string[];
    suitablePersona?: string;
    // Discovery fields
    isin?: string;
    schemeCode?: string;
    fundHouse?: string;
    assetClass?: AssetClass;
    benchmark?: string;
    expenseRatio?: number;
}

export interface ProductRecommendation extends Product {
    matchReason: string;
    relevanceScore: number;
}
