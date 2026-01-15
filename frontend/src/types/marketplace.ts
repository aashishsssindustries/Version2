export type ProductCategory = 'SIP' | 'Term Insurance' | 'Tax Saving' | 'Retirement' | 'General';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

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
}

export interface ProductRecommendation extends Product {
    matchReason: string;
    relevanceScore: number;
}
