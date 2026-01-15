import { MARKETPLACE_PRODUCTS } from '../data/products';
import { ProductRecommendation, RiskLevel } from '../types/marketplace';
import { ProfileModel } from '../models/profile.model';

export class MarketplaceService {

    static async getRecommendations(userId: string): Promise<ProductRecommendation[]> {
        const profile = await ProfileModel.findByUserId(userId);

        if (!profile) {
            // Default to all products if no profile
            return MARKETPLACE_PRODUCTS.map(p => ({
                ...p,
                matchReason: 'Complete your profile for personalized recommendations',
                relevanceScore: 30
            }));
        }

        const riskClass = profile.risk_class || 'Moderate';
        const actionItems = await ProfileModel.getActionItems(userId) || [];

        // Extract financial gaps from profile (using type assertion as these may be computed fields)
        const emergencyFundRatio = (profile as any).emergency_fund_ratio || 0;
        const savingsRate = (profile as any).savings_rate || 0;
        const debtToIncomeRatio = (profile as any).debt_to_income_ratio || 0;

        const recommendations: ProductRecommendation[] = MARKETPLACE_PRODUCTS.map(product => {
            let score = 0;
            let reasons: string[] = [];

            // 1. Risk Profile Match (Base Score)
            const isRiskMatch = this.checkRiskMatch(riskClass, product.riskLevel);
            if (isRiskMatch) {
                score += 30;
                reasons.push(`Matches your ${riskClass} risk profile`);
            }

            // 2. Emergency Fund Gap Detection
            if (emergencyFundRatio < 3 && product.tags.includes('emergency-fund')) {
                score += 60;
                reasons.push('Your emergency fund is below target');
            }

            // 3. Insurance Gap Detection
            const needsInsurance = actionItems.some(item =>
                item.risk_type === 'Insurance' ||
                item.title?.toLowerCase().includes('insurance')
            );
            if (needsInsurance && product.category === 'Term Insurance') {
                score += 55;
                reasons.push('Essential to cover your insurance gap');
            }

            // 4. Low Savings Rate Detection
            if (savingsRate < 20 && (product.category === 'SIP' || product.category === 'Tax Saving')) {
                score += 40;
                reasons.push('Helps improve your savings rate');
            }

            // 5. Tax Saving Season Boost
            const month = new Date().getMonth(); // 0-11
            if ((month >= 0 && month <= 2) && product.category === 'Tax Saving') {
                score += 25;
                reasons.push('Tax season special - save up to ₹46,800');
            }

            // 6. Retirement Planning
            const needsRetirement = actionItems.some(item =>
                item.risk_type === 'Retirement' ||
                item.title?.toLowerCase().includes('retirement')
            );
            if (needsRetirement && (product.category === 'Retirement' || product.tags.includes('retirement'))) {
                score += 45;
                reasons.push('Helps build your retirement corpus');
            }

            // 7. Debt Management
            if (debtToIncomeRatio > 40 && product.riskLevel === 'Low') {
                score += 20;
                reasons.push('Low-risk option suitable for debt management phase');
            }

            // 8. First-time Investor Boost
            if (profile.existing_assets === 0 && product.riskLevel === 'Low') {
                score += 35;
                reasons.push('Great start for new investors');
            }

            // 9. Wealth Creation for Moderate/Aggressive
            if ((riskClass === 'Moderate' || riskClass === 'Aggressive') &&
                product.category === 'SIP' &&
                product.riskLevel !== 'Low') {
                score += 25;
                reasons.push('Accelerate wealth creation with equity exposure');
            }

            // Default reason if none matched
            if (reasons.length === 0) {
                reasons.push('Recommended for diversified portfolio');
                score += 10;
            }

            return {
                ...product,
                relevanceScore: score,
                matchReason: reasons[0] // Pick the most relevant reason
            };
        });

        // Filter and adjust for risk mismatch
        let finalRecs = recommendations;

        if (riskClass === 'Conservative') {
            finalRecs = finalRecs.map(p => {
                if (p.riskLevel === 'High') {
                    p.relevanceScore = Math.max(0, p.relevanceScore - 80);
                    p.matchReason = 'High risk - not recommended for your profile';
                }
                return p;
            });
        }

        return finalRecs.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    private static checkRiskMatch(userRisk: string, productRisk: RiskLevel): boolean {
        const map: any = {
            'Conservative': ['Low'],
            'Moderate': ['Low', 'Moderate'],
            'Aggressive': ['Moderate', 'High', 'Low']
        };
        const allowed = map[userRisk] || ['Low'];
        return allowed.includes(productRisk);
    }
}
