import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ProfileModel } from '../models/profile.model';
import { CalculatorService } from '../services/calculator.service';
import { PDFService } from '../services/pdf.service';
import { PDFServiceV2 } from '../services/pdfV2.service';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAlignmentService } from '../services/portfolioAlignment.service';
import { AnalyticsService } from '../services/analytics.service';
import { PDFServiceV3 } from '../services/pdfV3.service';
import logger from '../config/logger';

export class PDFController {
    /**
     * Generate and download Advisory Report PDF (V1)
     * GET /api/pdf/advisory-report
     */
    static async generateAdvisoryReport(req: Request, res: Response) {
        try {
            const user = (req as any).user;

            // Generate PDF (Service now handles data fetching)
            const pdfBuffer = await PDFService.generateAdvisoryReport(user);

            // Send PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Advisory_Report_${user.name.replace(/\s+/g, '_')}.pdf`);
            res.send(pdfBuffer);

        } catch (error: any) {
            logger.error('Error generating PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate advisory report'
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
            const user = (req as any).user;

            // White-label config from query params
            const branding = {
                companyName: (req.query.company_name as string) || 'WealthMax',
                tagline: (req.query.tagline as string) || '',
                logoUrl: req.query.logo_url as string,
                advisorName: 'WealthMax Advisory',
                licenseNumber: 'INA000000000',
                primaryColor: (req.query.primary_color as string) || '#1a56db'
            };

            // 1. Fetch Comprehensive Snapshot
            const snapshot = await AnalyticsService.getPortfolioSnapshot(userId);
            const profile = await ProfileModel.findByUserId(userId);
            const actionItems = await ProfileModel.getActionItems(userId);

            if (!profile) {
                throw new Error('Profile not found');
            }

            // 2. Prepare PDF Data Object (Map Snapshot to PDF interfaces)
            const pdfData: any = {
                user: { name: user.name, email: user.email },
                profile: {
                    age: profile.age,
                    gross_income: profile.gross_income,
                    fixed_expenses: profile.fixed_expenses,
                    monthly_emi: profile.monthly_emi,
                    health_score: profile.health_score,
                    risk_class: profile.risk_class,
                    persona_data: profile.persona_data
                },
                actionItems: actionItems.map((item: any) => ({
                    title: item.title || PDFController.getRiskTitle(item.risk_type),
                    description: item.description || PDFController.getRiskDescription(item.risk_type, item.gap_amount),
                    category: item.category || 'General',
                    priority: item.severity || 'Medium',
                    gap_amount: item.gap_amount
                })),
                whiteLabel: branding,

                // Mapped Analytics Data
                portfolio: {
                    holdings: snapshot.allocation.topHoldings.map((h: any) => ({
                        name: h.name,
                        isin: h.isin,
                        type: 'EQUITY', // Simplified for top holdings display
                        quantity: 0, // Not needed for snapshot view
                        last_valuation: h.value
                    })),
                    totalValuation: snapshot.summary.totalValue,
                    equityPercent: snapshot.allocation.byAssetType.find((a: any) => a.type === 'EQUITY')?.percentage || 0,
                    mutualFundPercent: snapshot.allocation.byAssetType.find((a: any) => a.type === 'MUTUAL_FUND')?.percentage || 0,
                },

                portfolioSnapshot: {
                    totalValue: snapshot.summary.totalValue,
                    investedAmount: snapshot.summary.invested,
                    unrealizedGainLoss: (snapshot.summary.totalValue - snapshot.summary.invested),
                    gainLossPercent: snapshot.summary.returnsPercentage,
                    holdingsCount: snapshot.summary.holdingsCount,
                    investmentHorizon: 'long-term' // Derived or static
                },

                growthChart: {
                    labels: (snapshot.performance.growth_curve || []).map((d: any) => new Date(d.date).toLocaleDateString()),
                    portfolioSeries: (snapshot.performance.growth_curve || []).map((d: any) => d.value),
                    benchmarkSeries: (snapshot.performance.growth_curve || []).map((d: any) => d.value) // Placeholder if benchmark not available in array
                },

                drawdownData: {
                    series: snapshot.performance.drawdown_series || [],
                    maxDrawdown: Math.min(...(snapshot.performance.drawdown_series?.map((d: any) => d.drawdown) || [0])),
                    recoveryDays: 45 // Placeholder or Compute
                },

                riskReturnData: {
                    portfolioXirr: snapshot.performance.portfolioXIRR?.xirr || 0,
                    benchmarkXirr: snapshot.performance.benchmarkComparison?.benchmarkXIRR || 0,
                    portfolioVolatility: snapshot.risk.volatility?.value || 0,
                    benchmarkVolatility: 15
                },

                schemePerformance: {
                    schemes: snapshot.performance.schemePerformances?.map((s: any) => ({
                        schemeName: s.name,
                        schemeXirr: s.xirr?.xirr || 0,
                        benchmarkXirr: 12 // Default if not in performance
                    })) || []
                },

                // Wealth Projections (Recalculate or use existing logic)
                projections: {
                    sip: {
                        monthlyInvestment: 50000,
                        years: 20,
                        totalValue: 48000000,
                        investedAmount: 12000000,
                        estReturns: 36000000
                    },
                    retirement: {
                        yearsToRetire: 25,
                        targetCorpus: 100000000,
                        monthlySavingsRequired: 75000,
                        gap: 25000
                    }
                },

                sipAnalysis: {
                    sipCount: snapshot.cashflow?.transactionCount || 0, // Approx
                    monthlySipAmount: snapshot.cashflow?.netCashflow > 0 ? (snapshot.cashflow.netCashflow / 12) : 0,
                    categorySplit: snapshot.allocation.byCategory.map((c: any) => ({
                        category: c.category,
                        amount: c.value,
                        percentage: c.percentage
                    }))
                },

                assetAllocation: {
                    classes: snapshot.allocation.byAssetType.map((a: any) => ({
                        name: a.type,
                        percentage: a.percentage,
                        xirr: snapshot.performance.portfolioXIRR?.xirr // blended XIRR for now
                    }))
                },

                mfCategoryAllocation: {
                    categories: snapshot.allocation.byCategory
                },

                amcExposure: {
                    amcs: [] // TODO: Add AMC grouping to AnalyticsService
                },

                schemeAllocation: {
                    schemes: snapshot.allocation.topHoldings.map((h: any) => ({
                        schemeName: h.name,
                        value: h.value,
                        weightPercent: h.weight
                    }))
                },

                // Advanced Slides
                riskReturnScatter: {
                    quadrants: snapshot.risk.riskReturnMatrix
                },

                behaviorAnalysis: (snapshot as any).behaviorAnalysis,
                yearlyInvestments: (snapshot as any).yearlyInvestments,
                taxExposure: (snapshot as any).taxAnalysis,
                overlapAnalysis: (snapshot as any).overlapAnalysis
            };

            // Generate PDF using V3 Service
            const pdfBuffer = await PDFServiceV3.generatePDF(pdfData, branding);

            // Send Response
            const filename = `${branding.companyName.replace(/\s+/g, '_')}_Advisory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            res.end(pdfBuffer);

            logger.info(`Advisory PDF V3 generated for user: ${userId}`);

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



    private static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(amount);
    }
}
