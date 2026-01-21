import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ProfileModel } from '../models/profile.model';
import { CalculatorService } from '../services/calculator.service';
import { PDFService } from '../services/pdf.service';
import { PDFServiceV2 } from '../services/pdfV2.service';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAlignmentService } from '../services/portfolioAlignment.service';
import logger from '../config/logger';

export class PDFController {
    /**
     * Generate and download Advisory Report PDF (V1)
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
                    title: item.title || PDFController.getRiskTitle(item.risk_type || item.category || 'General'),
                    description: item.description || PDFController.getRiskDescription(item.risk_type, item.gap_amount),
                    category: item.category || item.risk_type || 'General',
                    priority: item.severity || item.priority || 'Medium',
                    gap_amount: item.gap_amount || 0,
                    estimated_score_impact: item.estimated_score_impact || 0,
                    action: item.action || PDFController.getRiskAction(item.risk_type || item.category || 'General')
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

    /**
     * Generate White-Labeled Advisory Report V2
     * GET /api/pdf/advisory-report-v2
     */
    static async generateAdvisoryReportV2(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // Optional branding from query params or body
            const branding = req.body?.branding || {
                companyName: req.query.brand as string || 'WealthMax',
                tagline: req.query.tagline as string || 'Automated Financial Advisory',
                primaryColor: req.query.color as string || '#1a56db'
            };

            // 1. Fetch User Data
            const user = await UserModel.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // 2. Fetch Profile Data
            const profile = await ProfileModel.findByUserId(userId);
            if (!profile) {
                res.status(404).json({ success: false, message: 'Financial profile not found' });
                return;
            }

            // 3. Fetch Action Items
            const actionItems = await ProfileModel.getActionItems(userId);

            // 4. Fetch Portfolio (if available)
            let portfolioData = undefined;
            try {
                const holdings = await PortfolioService.getHoldings(userId);
                if (holdings.length > 0) {
                    const summary = await PortfolioService.getPortfolioSummary(userId);
                    const personaName = (profile.persona_data as any)?.persona?.name || 'General';
                    const alignment = PortfolioAlignmentService.analyzeHoldings(holdings, personaName);

                    let equityValue = 0;
                    let mfValue = 0;
                    holdings.forEach((h: any) => {
                        if (h.type === 'EQUITY') equityValue += h.last_valuation || 0;
                        else mfValue += h.last_valuation || 0;
                    });
                    const total = equityValue + mfValue;

                    portfolioData = {
                        holdings: holdings.map((h: any) => ({
                            name: h.name,
                            isin: h.isin,
                            type: h.type,
                            quantity: h.quantity,
                            last_valuation: h.last_valuation
                        })),
                        totalValuation: summary.totalValuation,
                        equityPercent: total > 0 ? (equityValue / total) * 100 : 0,
                        mutualFundPercent: total > 0 ? (mfValue / total) * 100 : 0,
                        alignmentScore: alignment.alignmentScore,
                        advisoryFlags: alignment.advisoryFlags
                    };
                }
            } catch (error) {
                logger.warn('Portfolio fetch failed for V2 PDF', error);
            }

            // 5. Calculate Summaries
            let sipSummary = undefined;
            let retirementSummary = undefined;

            try {
                const surplus = profile.gross_income - profile.fixed_expenses - profile.monthly_emi;
                const suggestedSIP = Math.max(surplus * 0.3, 5000);
                const sipResult = CalculatorService.calculateSIP(suggestedSIP, 12, 10);
                sipSummary = {
                    monthlyInvestment: suggestedSIP,
                    years: 10,
                    totalValue: sipResult.summary.totalValue,
                    investedAmount: sipResult.summary.investedAmount,
                    estReturns: sipResult.summary.estReturns
                };
            } catch { /* skip */ }

            if (profile.age && profile.age < 60) {
                try {
                    const retResult = CalculatorService.calculateRetirement(
                        profile.age, 60, profile.fixed_expenses, 6, profile.existing_assets, 12, 8
                    );
                    retirementSummary = {
                        yearsToRetire: retResult.summary.yearsToRetire,
                        targetCorpus: retResult.summary.targetCorpus,
                        monthlySavingsRequired: retResult.summary.monthlySavingsRequired,
                        gap: retResult.summary.gap
                    };
                } catch { /* skip */ }
            }

            // 6. Prepare V2 PDF Data
            const pdfDataV2 = {
                user: { name: user.name, email: user.email },
                profile: {
                    age: profile.age,
                    gross_income: profile.gross_income,
                    fixed_expenses: profile.fixed_expenses,
                    monthly_emi: profile.monthly_emi,
                    employment_type: profile.employment_type,
                    health_score: profile.health_score,
                    persona_data: profile.persona_data,
                    risk_class: profile.risk_class
                },
                actionItems: actionItems.map((item: any) => ({
                    title: item.title || PDFController.getRiskTitle(item.risk_type || item.category || 'General'),
                    description: item.description || PDFController.getRiskDescription(item.risk_type, item.gap_amount),
                    category: item.category || item.risk_type || 'General',
                    priority: item.severity || item.priority || 'Medium',
                    gap_amount: item.gap_amount || 0,
                    estimated_score_impact: item.estimated_score_impact || 0
                })),
                portfolio: portfolioData,
                calculatorSummary: { sip: sipSummary, retirement: retirementSummary },
                branding
            };

            // 7. Generate V2 PDF
            const pdfBuffer = await PDFServiceV2.generateAdvisoryReportV2(pdfDataV2);

            // 8. Send Response
            const filename = `${branding.companyName.replace(/\s+/g, '_')}_Advisory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length.toString());
            res.end(pdfBuffer);

            logger.info(`Advisory PDF V2 generated for user: ${userId}`);

            // [COMPLIANCE] Audit Log
            const { AuditService } = await import('../services/audit.service');
            await AuditService.log({
                userId,
                action: 'GENERATE_ADVISORY_REPORT_V2',
                resource: 'report',
                details: { branding: branding.companyName, reportId: `WM-V2-${new Date().getTime()}` },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

        } catch (error: any) {
            logger.error('PDF V2 Generation Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate PDF report'
            });
        }
    }

    /**
     * Generate White-Labeled Advisory Report V3 (Puppeteer HTML-to-PDF)
     * GET /api/pdf/advisory-report-v3
     * Query params: company_name, logo_url, primary_color
     */
    static async generateAdvisoryReportV3(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // White-label config from query params
            const whiteLabel = {
                companyName: (req.query.company_name as string) || 'WealthMax',
                logoUrl: req.query.logo_url as string | undefined,
                primaryColor: (req.query.primary_color as string) || '#1a56db',
                advisorName: (req.query.advisor_name as string) || 'WealthMax Advisory',
                licenseNumber: (req.query.license_number as string) || 'INA000000000'
            };

            // 1. Fetch User
            const user = await UserModel.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // 2. Fetch Profile
            const profile = await ProfileModel.findByUserId(userId);
            if (!profile) {
                res.status(404).json({ success: false, message: 'Financial profile not found' });
                return;
            }

            // 3. Fetch Action Items
            const actionItems = await ProfileModel.getActionItems(userId);

            // 4. Fetch Portfolio
            let portfolioData = undefined;
            try {
                const holdings = await PortfolioService.getHoldings(userId);
                if (holdings.length > 0) {
                    const summary = await PortfolioService.getPortfolioSummary(userId);
                    const personaName = (profile.persona_data as any)?.persona?.name || 'General';
                    const alignment = PortfolioAlignmentService.analyzeHoldings(holdings, personaName);

                    let equityValue = 0, mfValue = 0;
                    holdings.forEach((h: any) => {
                        if (h.type === 'EQUITY') equityValue += h.last_valuation || 0;
                        else mfValue += h.last_valuation || 0;
                    });
                    const total = equityValue + mfValue;

                    portfolioData = {
                        holdings: holdings.map((h: any) => ({
                            name: h.name,
                            isin: h.isin,
                            type: h.type,
                            quantity: h.quantity,
                            last_valuation: h.last_valuation
                        })),
                        totalValuation: summary.totalValuation,
                        equityPercent: total > 0 ? (equityValue / total) * 100 : 0,
                        mutualFundPercent: total > 0 ? (mfValue / total) * 100 : 0,
                        alignmentScore: alignment.alignmentScore,
                        idealAllocation: alignment.idealAllocation
                    };
                }
            } catch (error) {
                logger.warn('Portfolio fetch failed for V3 PDF', error);
            }

            // 5. Calculate Projections
            let projections = undefined;
            try {
                const surplus = profile.gross_income - profile.fixed_expenses - profile.monthly_emi;
                const suggestedSIP = Math.max(surplus * 0.3, 5000);
                const sipResult = CalculatorService.calculateSIP(suggestedSIP, 12, 10);

                projections = {
                    sip: {
                        monthlyInvestment: suggestedSIP,
                        years: 10,
                        totalValue: sipResult.summary.totalValue,
                        investedAmount: sipResult.summary.investedAmount,
                        estReturns: sipResult.summary.estReturns
                    }
                } as any;

                if (profile.age && profile.age < 60) {
                    const retResult = CalculatorService.calculateRetirement(
                        profile.age, 60, profile.fixed_expenses, 6, profile.existing_assets, 12, 8
                    );
                    projections.retirement = {
                        yearsToRetire: retResult.summary.yearsToRetire,
                        targetCorpus: retResult.summary.targetCorpus,
                        monthlySavingsRequired: retResult.summary.monthlySavingsRequired,
                        gap: retResult.summary.gap
                    };
                }
            } catch { /* skip */ }

            // 6. Fetch Marketplace Recommendations
            let marketplaceProducts = undefined;
            try {
                const { MarketplaceService } = await import('../services/marketplace.service');
                const recommendations = await MarketplaceService.getRecommendations(userId);
                if (recommendations && recommendations.length > 0) {
                    marketplaceProducts = recommendations.slice(0, 6).map((r: any) => ({
                        name: r.name,
                        category: r.category,
                        isin: r.isin,
                        schemeCode: r.scheme_code,
                        riskLevel: r.risk_level || 'Moderate',
                        whyRecommended: r.why_recommended || 'Matches your profile'
                    }));
                }
            } catch (error) {
                logger.warn('Marketplace fetch failed for V3 PDF', error);
            }

            // 7. Prepare V3 Data
            const { PDFServiceV3 } = await import('../services/pdfV3.service');
            const pdfDataV3 = {
                user: { name: user.name, email: user.email },
                profile: {
                    age: profile.age,
                    gross_income: profile.gross_income,
                    fixed_expenses: profile.fixed_expenses,
                    monthly_emi: profile.monthly_emi,
                    existing_assets: profile.existing_assets,
                    emergency_fund_amount: profile.emergency_fund_amount,
                    insurance_cover: profile.insurance_coverage || profile.insurance_cover,
                    health_score: profile.health_score,
                    persona_data: profile.persona_data,
                    risk_class: profile.risk_class
                },
                actionItems: actionItems.map((item: any) => ({
                    title: item.title || PDFController.getRiskTitle(item.risk_type || item.category || 'General'),
                    description: item.description || PDFController.getRiskDescription(item.risk_type, item.gap_amount),
                    category: item.category || item.risk_type || 'General',
                    priority: item.severity || item.priority || 'Medium',
                    gap_amount: item.gap_amount || 0,
                    estimated_score_impact: item.estimated_score_impact || 0
                })),
                portfolio: portfolioData,
                projections,
                marketplaceProducts,
                whiteLabel
            };

            // 8. Generate V3 PDF
            const pdfBuffer = await PDFServiceV3.generateAdvisoryReportV3(pdfDataV3);

            // 9. Send Response
            const filename = `${whiteLabel.companyName.replace(/\s+/g, '_')}_Advisory_Report_V3_${new Date().toISOString().split('T')[0]}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length.toString());
            res.end(pdfBuffer);

            logger.info(`Advisory PDF V3 generated for user: ${userId}`);

            // Audit log
            const { AuditService } = await import('../services/audit.service');
            await AuditService.log({
                userId,
                action: 'GENERATE_ADVISORY_REPORT_V3',
                resource: 'report',
                details: { branding: whiteLabel.companyName },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

        } catch (error: any) {
            logger.error('PDF V3 Generation Error', error);
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
