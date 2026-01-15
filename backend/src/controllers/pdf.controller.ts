import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ProfileModel } from '../models/profile.model';
import { CalculatorService } from '../services/calculator.service';
import { PDFService } from '../services/pdf.service';
import logger from '../config/logger';

export class PDFController {
    /**
     * Generate and download Advisory Report PDF
     * GET /api/pdf/advisory-report
     */
    static async generateAdvisoryReport(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // 1. Fetch User Data
            const user = await UserModel.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // 2. Fetch Profile Data
            const profile = await ProfileModel.findByUserId(userId);
            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'Financial profile not found. Please complete your profile first.'
                });
                return;
            }

            // 3. Fetch Action Items
            const actionItems = await ProfileModel.getActionItems(userId);

            // 4. Calculate SIP Summary (using default values for demo)
            // In production, you might want to store user's calculator preferences
            let sipSummary = undefined;
            try {
                const monthlySurplus = profile.gross_income - profile.fixed_expenses - profile.monthly_emi;
                const suggestedSIP = Math.max(monthlySurplus * 0.3, 5000); // 30% of surplus or min 5000

                const sipResult = CalculatorService.calculateSIP(
                    suggestedSIP,
                    12, // 12% annual return
                    10  // 10 years
                );

                sipSummary = {
                    monthlyInvestment: suggestedSIP,
                    years: 10,
                    totalValue: sipResult.summary.totalValue,
                    investedAmount: sipResult.summary.investedAmount,
                    estReturns: sipResult.summary.estReturns
                };
            } catch (error) {
                logger.warn('SIP calculation failed for PDF', error);
            }

            // 5. Calculate Retirement Summary (if age is available)
            let retirementSummary = undefined;
            if (profile.age && profile.age < 60) {
                try {
                    const retirementResult = CalculatorService.calculateRetirement(
                        profile.age,
                        60, // Retirement age
                        profile.fixed_expenses, // Monthly expenses
                        6,  // 6% inflation
                        profile.existing_assets,
                        12, // 12% pre-retirement return
                        8   // 8% post-retirement return
                    );

                    retirementSummary = {
                        yearsToRetire: retirementResult.summary.yearsToRetire,
                        targetCorpus: retirementResult.summary.targetCorpus,
                        monthlySavingsRequired: retirementResult.summary.monthlySavingsRequired,
                        gap: retirementResult.summary.gap
                    };
                } catch (error) {
                    logger.warn('Retirement calculation failed for PDF', error);
                }
            }

            // 6. Prepare PDF Data
            const pdfData = {
                user: {
                    name: user.name,
                    email: user.email
                },
                profile: {
                    age: profile.age,
                    gross_income: profile.gross_income,
                    employment_type: profile.employment_type,
                    health_score: profile.health_score,
                    persona_data: profile.persona_data,
                    risk_class: profile.risk_class
                },
                actionItems: actionItems.map((item: any) => ({
                    title: this.getRiskTitle(item.risk_type),
                    description: this.getRiskDescription(item.risk_type, item.gap_amount),
                    category: item.risk_type,
                    priority: item.severity,
                    gap_amount: item.gap_amount,
                    estimated_score_impact: item.estimated_score_impact,
                    action: this.getRiskAction(item.risk_type)
                })),
                calculatorSummary: {
                    sip: sipSummary,
                    retirement: retirementSummary
                },
                generatedDate: new Date().toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };

            // 7. Generate PDF
            const pdfBuffer = await PDFService.generateAdvisoryReport(pdfData);

            // 8. Set Response Headers
            const filename = `WealthMax_Advisory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length.toString());

            // 9. Send PDF Response
            res.end(pdfBuffer);

            logger.info(`Advisory PDF generated for user: ${userId}`);

        } catch (error: any) {
            logger.error('PDF Generation Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate PDF report'
            });
        }
    }

    // Helper methods to generate user-friendly content
    private static getRiskTitle(riskType: string): string {
        const titles: Record<string, string> = {
            'High Liabilities': 'High Debt Burden',
            'Low Savings': 'Insufficient Savings Rate',
            'No Emergency Fund': 'Missing Emergency Fund',
            'Under-Insured': 'Inadequate Insurance Coverage',
            'High Expenses': 'Excessive Monthly Expenses',
            'Risk-Behavior Mismatch': 'Investment Risk Mismatch',
            'Low Investment': 'Underinvestment in Growth Assets'
        };
        return titles[riskType] || riskType;
    }

    private static getRiskDescription(riskType: string, gapAmount?: number): string {
        const descriptions: Record<string, string> = {
            'High Liabilities': 'Your debt-to-income ratio is higher than recommended. High liabilities can limit your financial flexibility and increase stress during emergencies.',
            'Low Savings': 'Your current savings rate is below the ideal threshold. Building a consistent savings habit is crucial for long-term financial security.',
            'No Emergency Fund': 'You lack an adequate emergency fund. Financial experts recommend maintaining 6-12 months of expenses in liquid savings for unexpected situations.',
            'Under-Insured': 'Your insurance coverage may not be sufficient to protect your family in case of unforeseen events. Adequate insurance is a cornerstone of financial planning.',
            'High Expenses': 'Your monthly expenses consume a large portion of your income, leaving little room for savings and investments.',
            'Risk-Behavior Mismatch': 'Your investment choices may not align with your risk tolerance and financial goals. This mismatch can lead to suboptimal returns or excessive stress.',
            'Low Investment': 'Your investment allocation is lower than recommended for your age and income level. Increasing investments can help you build wealth over time.'
        };

        let desc = descriptions[riskType] || 'This area requires attention to improve your overall financial health.';

        if (gapAmount && gapAmount > 0) {
            desc += ` Current gap: ₹${this.formatCurrency(gapAmount)}.`;
        }

        return desc;
    }

    private static getRiskAction(riskType: string): string {
        const actions: Record<string, string> = {
            'High Liabilities': 'Consider debt consolidation or accelerated repayment strategies. Focus on clearing high-interest debt first.',
            'Low Savings': 'Set up automatic transfers to a savings account. Aim to save at least 20-30% of your monthly income.',
            'No Emergency Fund': 'Start building an emergency fund immediately. Begin with a target of 3 months\' expenses and gradually increase to 6-12 months.',
            'Under-Insured': 'Review your insurance needs with a certified advisor. Consider term life insurance and health insurance with adequate coverage.',
            'High Expenses': 'Track and categorize your expenses. Identify areas where you can cut back without compromising quality of life.',
            'Risk-Behavior Mismatch': 'Reassess your investment portfolio. Consult with a financial advisor to align your investments with your risk profile.',
            'Low Investment': 'Increase your SIP contributions gradually. Consider diversifying across equity, debt, and other asset classes.'
        };
        return actions[riskType] || 'Consult with a financial advisor for personalized guidance.';
    }

    private static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(amount);
    }
}
