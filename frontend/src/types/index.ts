export interface User {
    id: string;
    email: string;
    name: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export interface FinancialProfile {
    id: string;
    userId: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    currentSavings: number;
    monthlyDebt: number;
    existingLumpsumInvestment: number;
    currentSIPAmount: number;
    dependents: number;
    riskCategory?: 'conservative' | 'moderate' | 'aggressive';
    createdAt: string;
    updatedAt: string;
}

export interface HealthScore {
    score: number;
    category: 'poor' | 'fair' | 'good' | 'excellent';
    factors: {
        savingsRatio: number;
        debtRatio: number;
        investmentRatio: number;
    };
}

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
}
