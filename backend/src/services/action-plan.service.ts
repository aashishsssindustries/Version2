import { ProfileModel } from '../models/profile.model';

export interface ActionItem {
    type: 'Emergency Fund' | 'Debt Management' | 'Insurance' | 'Investment' | 'General';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    action: string;
}

export class ActionPlanService {

    static async generate(userId: string): Promise<ActionItem[]> {
        const profile = await ProfileModel.findByUserId(userId);
        if (!profile) return [];

        const actions: ActionItem[] = [];
        const income = Number(profile.gross_income || 0) / 12; // Annual -> Monthly
        const emi = Number(profile.monthly_emi || 0);
        const expenses = Number(profile.fixed_expenses || 0);
        const assets = Number(profile.existing_assets || 0);
        const liabilities = Number(profile.total_liabilities || 0);
        const coverage = Number(profile.insurance_coverage || 0);

        // 1. Emergency Fund Detection
        // Rule: Liquidity < 3 months expenses -> High Severity
        // Rule: Liquidity < 1 month -> Critical
        const monthsCovered = expenses > 0 ? assets / expenses : 0;

        if (monthsCovered < 1) {
            actions.push({
                type: 'Emergency Fund',
                severity: 'CRITICAL',
                message: 'You have less than 1 month of emergency runway.',
                action: 'Immediately halt non-essential spending and build a cash reserve.'
            });
        } else if (monthsCovered < 3) {
            actions.push({
                type: 'Emergency Fund',
                severity: 'HIGH',
                message: 'Your emergency fund is below the recommended 3 months.',
                action: 'Saving for emergencies should be your top priority.'
            });
        } else if (monthsCovered < 6) {
            actions.push({
                type: 'Emergency Fund',
                severity: 'MEDIUM',
                message: 'Aim for 6 months of expenses for better security.',
                action: 'Gradually increase your liquid savings.'
            });
        }

        // 2. Debt Trap Detection
        // Rule: EMI > 50% Income -> Critical
        // Rule: EMI > 30% Income -> High
        const debtRatio = income > 0 ? emi / income : 0;

        if (debtRatio > 0.50) {
            actions.push({
                type: 'Debt Management',
                severity: 'CRITICAL',
                message: 'You are spending over 50% of your income on EMIs.',
                action: 'Consider debt consolidation or aggressive repayment immediately.'
            });
        } else if (debtRatio > 0.30) {
            actions.push({
                type: 'Debt Management',
                severity: 'HIGH',
                message: 'Your debt-to-income ratio is high (>30%).',
                action: 'Avoid taking new loans and prioritize clearing high-interest debt.'
            });
        }

        // 3. Under-insurance Detection
        // Rule: Coverage < (10 * Annual Income + Liabilities)
        const annualIncome = income * 12;
        const requiredCoverage = (10 * annualIncome) + liabilities;

        if (coverage < requiredCoverage) {
            // Check how severe
            const gap = requiredCoverage - coverage;
            const severity = gap > (5 * income) ? 'CRITICAL' : 'HIGH';

            actions.push({
                type: 'Insurance',
                severity: severity,
                message: `You are under-insured by ₹${gap.toLocaleString()}.`,
                action: `Increase your term insurance coverage to at least ₹${requiredCoverage.toLocaleString()}.`
            });
        }

        // 4. Sort by Severity
        const severityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        actions.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

        // 5. Persist
        await ProfileModel.update(userId, { action_items: actions });

        return actions;
    }
}
