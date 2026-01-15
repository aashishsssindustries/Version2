import { FinancialProfile } from '../models/profile.model';

export interface NextBestAction {
    actionType: 'PROFILE_INCOMPLETE' | 'EMERGENCY_FUND' | 'INSURANCE' | 'NO_SIP' | 'HIGH_DEBT' | 'ALL_CLEAR';
    title: string;
    reason: string;
    gapAmount?: number;
    targetAmount?: number;
    currentValue?: number;
    scoreImpact: number;
    ctaText: string;
    ctaLink: string;
    progressPercent?: number;
    whyMatters?: string;
}

export class NextBestActionService {

    /**
     * Priority Detection Engine
     * Evaluates profile and returns the highest priority action
     */
    static detectNextBestAction(profile: FinancialProfile | null): NextBestAction {

        // Priority 1: Profile Incomplete
        if (!profile || this.isProfileIncomplete(profile)) {
            return {
                actionType: 'PROFILE_INCOMPLETE',
                title: 'Complete Your Financial Profile',
                reason: 'We need more information to provide accurate recommendations',
                scoreImpact: 0,
                ctaText: 'Complete Profile',
                ctaLink: '/profile',
                whyMatters: 'A complete profile allows us to calculate your emergency fund needs, insurance coverage gaps, and investment opportunities accurately.'
            };
        }

        const monthlyExpenses = profile.fixed_expenses || 0;
        const monthlyIncome = profile.gross_income || 0;
        const monthlyEMI = profile.monthly_emi || 0;
        const emergencyFund = profile.emergency_fund_amount || 0;
        const insuranceCover = profile.insurance_cover || 0;
        const investableSurplus = monthlyIncome - monthlyExpenses - monthlyEMI;

        // Priority 2: Emergency Fund Gap
        const liquidityMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;
        if (liquidityMonths < 3) {
            const targetAmount = monthlyExpenses * 3;
            const gap = targetAmount - emergencyFund;

            return {
                actionType: 'EMERGENCY_FUND',
                title: 'Build Your Emergency Fund',
                reason: `You have only ${liquidityMonths.toFixed(1)} months of expenses saved. Experts recommend 3-6 months.`,
                gapAmount: gap,
                targetAmount: targetAmount,
                currentValue: emergencyFund,
                scoreImpact: 12,
                ctaText: 'Plan Emergency Fund',
                ctaLink: '/calculators?tool=sip&context=emergency',
                progressPercent: (emergencyFund / targetAmount) * 100,
                whyMatters: 'An emergency fund protects you from unexpected job loss, medical emergencies, or urgent repairs without touching investments or taking debt.'
            };
        }

        // Priority 3: Insurance Under-coverage
        const requiredCover = monthlyIncome * 12 * 10; // 10x annual income
        if (insuranceCover < requiredCover) {
            const gap = requiredCover - insuranceCover;

            return {
                actionType: 'INSURANCE',
                title: 'Increase Life Insurance Coverage',
                reason: `Your current cover is ${((insuranceCover / requiredCover) * 100).toFixed(0)}% of recommended amount`,
                gapAmount: gap,
                targetAmount: requiredCover,
                currentValue: insuranceCover,
                scoreImpact: 15,
                ctaText: 'Calculate Insurance Need',
                ctaLink: '/calculators?tool=life-insurance',
                progressPercent: (insuranceCover / requiredCover) * 100,
                whyMatters: 'Adequate life insurance ensures your family can maintain their lifestyle and meet financial goals even in your absence.'
            };
        }

        // Priority 4: No Active SIP (Surplus available but not invested)
        if (investableSurplus > 5000 && (profile.existing_assets || 0) < monthlyIncome * 3) {
            return {
                actionType: 'NO_SIP',
                title: 'Start a Systematic Investment Plan',
                reason: `You have ₹${investableSurplus.toLocaleString('en-IN')} monthly surplus that could be invested`,
                gapAmount: investableSurplus,
                targetAmount: investableSurplus * 0.7, // Suggest 70% of surplus
                scoreImpact: 10,
                ctaText: 'Start SIP',
                ctaLink: '/calculators?tool=sip',
                whyMatters: 'Starting early with SIP allows compound interest to work in your favor. Even ₹5,000/month can grow to ₹1 Cr+ in 20 years at 12% returns.'
            };
        }

        // Priority 5: High Debt Ratio
        const debtRatio = monthlyIncome > 0 ? monthlyEMI / monthlyIncome : 0;
        if (debtRatio > 0.4) {
            return {
                actionType: 'HIGH_DEBT',
                title: 'Reduce Debt Burden',
                reason: `${(debtRatio * 100).toFixed(0)}% of your income goes to EMIs. Recommended is below 40%.`,
                currentValue: monthlyEMI,
                targetAmount: monthlyIncome * 0.4,
                scoreImpact: 8,
                ctaText: 'View Debt Strategy',
                ctaLink: '/calculators?tool=emi',
                progressPercent: (0.4 / debtRatio) * 100,
                whyMatters: 'High debt reduces your financial flexibility and limits investment capacity. Bringing EMIs below 40% of income frees up cash flow.'
            };
        }

        // All Clear!
        return {
            actionType: 'ALL_CLEAR',
            title: 'Great Job! Your Finances Look Healthy',
            reason: 'You have a solid emergency fund, adequate insurance, and healthy cash flow',
            scoreImpact: 0,
            ctaText: 'Explore Advanced Strategies',
            ctaLink: '/calculators',
            whyMatters: 'Continue optimizing with tax-saving investments, retirement planning, and wealth creation strategies.'
        };
    }

    /**
     * Check if profile has all required fields
     */
    private static isProfileIncomplete(profile: FinancialProfile): boolean {
        const requiredFields = [
            'age',
            'gross_income',
            'fixed_expenses',
            'monthly_emi',
            'existing_assets',
            'total_liabilities',
            'emergency_fund_amount',
            'insurance_cover'
        ];

        return requiredFields.some(field => {
            const value = (profile as any)[field];
            return value === null || value === undefined;
        });
    }

    /**
     * Get completion percentage of profile
     */
    static getProfileCompletionPercent(profile: FinancialProfile | null): number {
        if (!profile) return 0;

        const requiredFields = [
            'age',
            'gross_income',
            'fixed_expenses',
            'monthly_emi',
            'existing_assets',
            'total_liabilities',
            'emergency_fund_amount',
            'dependents',
            'insurance_cover'
        ];

        const completedFields = requiredFields.filter(field => {
            const value = (profile as any)[field];
            return value !== null && value !== undefined && value !== 0;
        });

        return Math.round((completedFields.length / requiredFields.length) * 100);
    }
}
