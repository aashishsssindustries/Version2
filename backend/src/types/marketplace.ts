export type ProductCategory = 'SIP' | 'Term Insurance' | 'Tax Saving' | 'Retirement' | 'General';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

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
}

export interface ProductRecommendation extends Product {
    matchReason: string; // "Matches your Aggressive risk profile"
    relevanceScore: number; // For sorting
}
