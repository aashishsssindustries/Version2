import { ProfileModel, FinancialProfile } from '../models/profile.model';
import { GoalModel } from '../models/goal.model';

// We need to fetch survey responses to calculate literacy.
// We'll fetch latest survey inside the service.

export class HealthService {

    static async recalculate(userId: string): Promise<FinancialProfile | null> {
        // 1. Fetch Profile and Survey
        const profile = await ProfileModel.findByUserId(userId);
        if (!profile) return null;



        const income = Number(profile.gross_income || 0) / 12; // Annual -> Monthly
        const expenses = Number(profile.fixed_expenses || 0);
        const emi = Number(profile.monthly_emi || 0);
        const premium = Number(profile.insurance_premium || 0) / 12; // Annual -> Monthly
        const assets = Number(profile.existing_assets || 0); // Total Assets

        // --- A. Savings Rate (20%) ---
        // Formula: (Inv + Emergency Allocation) / Income
        // We use (Income - Expenses - EMI - Premium) as "Surplus" proxy for Inv+Emergency
        const surplus = income - (expenses + emi + premium);
        const savingsRatio = income > 0 ? surplus / income : 0;
        // Logic: 20% ratio = 20 pts (Max).
        let scoreSavings = (savingsRatio / 0.20) * 20;
        if (scoreSavings > 20) scoreSavings = 20;
        if (scoreSavings < 0) scoreSavings = 0;

        // --- B. Debt Ratio (20%) ---
        // Formula: EMI / Income
        const debtRatio = income > 0 ? emi / income : 0;
        let scoreDebt = 20; // Start with full
        if (debtRatio > 0.40) {
            scoreDebt = 0; // Heavy penalty > 40%
        } else if (debtRatio > 0.30) {
            // 30-40% range: Linear drop from 15 to 0
            scoreDebt = 15 - ((debtRatio - 0.30) / 0.10) * 15;
        } else {
            // 0-30% range: Linear drop from 20 to 15? Or just 20? 
            // SRS says "Guardrail > 40%". Let's keep 20 for <30%.
            scoreDebt = 20;
        }

        // --- C. Liquidity (15%) ---
        // Formula: Emergency Fund / Expenses. Target 6 months.
        // We assume 'assets' includes emergency fund or user input specifically? 
        // For now, assume 20% of 'existing_assets' is liquid/emergency or 100%?
        // Let's assume 'existing_assets' is total.
        // Better: Check if `asset_types` has 'Savings'/'Main Balance'.
        // Simplified: Use Total Assets / Expenses for now, or assume 50% liquidity.
        // Strict approach: We don't have specific "Emergency Fund" field yet.
        // We'll use Total Assets for now but note importance of Liquidity.
        const monthsCovered = expenses > 0 ? assets / expenses : 0;
        let scoreLiquidity = (monthsCovered / 6) * 15;
        if (scoreLiquidity > 15) scoreLiquidity = 15;

        // --- D. Asset Diversity (15%) ---
        // Spread across asset classes.
        const assetMap = (profile.asset_types as any) || {};
        const assetValues: number[] = Object.values(assetMap).map((v: any) => Number(v));
        const totalAssetVal = assetValues.reduce((a, b) => a + b, 0);

        let scoreDiversity = 10; // Default Neutral
        if (totalAssetVal > 0) {
            const maxAlloc = Math.max(...assetValues) / totalAssetVal;
            const distinctCats = assetValues.filter(v => v > 0).length;

            if (maxAlloc > 0.70) scoreDiversity = 5; // Penalty
            else if (distinctCats >= 3) scoreDiversity = 15; // Reward
            else scoreDiversity = 10;
        } else {
            scoreDiversity = 5; // No assets
        }

        // --- E. Goal Preparedness (15%) ---
        const goals = await GoalModel.findByUserId(userId);
        let scoreGoal = 0;

        if (goals.length === 0) {
            scoreGoal = 5; // Neutral start for having no goals yet
        } else {
            // Logic:
            // 5 pts for defining goals
            // 10 pts for funding status (Avg % covered or contributing)
            // Simple proxy: If monthly_contribution > 0, it's "Active".
            const activeGoals = goals.filter(g => Number(g.monthly_contribution) > 0 || Number(g.current_amount) > 0).length;
            const activityRatio = activeGoals / goals.length;

            scoreGoal = 5 + (activityRatio * 10);
        }

        // --- F. Financial Literacy (15%) ---
        // Derived from Survey Score (0-100)
        // Score = (SurveyNorm / 100) * 15
        let scoreLiteracy = 0;
        if (profile.risk_score) {
            scoreLiteracy = (profile.risk_score / 100) * 15;
        }

        // Total
        const totalHealth = Math.round(scoreSavings + scoreDebt + scoreLiquidity + scoreDiversity + scoreGoal + scoreLiteracy);

        // Breakdown for Explainability
        const breakdown = {
            savings: { score: Math.round(scoreSavings), max: 20 },
            debt: { score: Math.round(scoreDebt), max: 20 },
            liquidity: { score: Math.round(scoreLiquidity), max: 15 },
            diversity: { score: Math.round(scoreDiversity), max: 15 },
            goals: { score: Math.round(scoreGoal), max: 15 },
            literacy: { score: Math.round(scoreLiteracy), max: 15 }
        };

        // Update Profile
        // Store breakdown in persona_data or dedicated field? 
        // Using persona_data.health_factors is cleaner without migration.
        const personaData = profile.persona_data || {};
        personaData.health_factors = breakdown;

        await ProfileModel.update(userId, {
            health_score: totalHealth,
            persona_data: personaData
        });

        return { ...profile, health_score: totalHealth, persona_data: personaData };
    }
}
