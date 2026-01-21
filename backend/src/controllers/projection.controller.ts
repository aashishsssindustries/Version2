import { Request, Response } from 'express';
import { ProjectionService } from '../services/projection.service';
import { ProfileModel } from '../models/profile.model';

export class ProjectionController {

    /**
     * POST /api/projections/sip
     * Generate SIP growth projection
     */
    static getSIPProjection(req: Request, res: Response) {
        try {
            const { monthlyInvestment, rate, years } = req.body;

            if ([monthlyInvestment, rate, years].some(val => val === undefined || isNaN(Number(val)))) {
                res.status(400).json({ success: false, message: 'Invalid or missing parameters: monthlyInvestment, rate, years' });
                return;
            }

            const projection = ProjectionService.generateSIPProjection({
                monthlyInvestment: Number(monthlyInvestment),
                rate: Number(rate),
                years: Number(years)
            });

            res.json({ success: true, data: projection });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/projections/retirement
     * Generate retirement glide path
     */
    static getRetirementGlidePath(req: Request, res: Response) {
        try {
            const {
                currentAge,
                retirementAge,
                monthlyExpenses,
                inflationRate,
                existingSavings,
                expectedReturn,
                postRetirementReturn
            } = req.body;

            const required = [currentAge, retirementAge, monthlyExpenses, inflationRate, existingSavings, expectedReturn];
            if (required.some(val => val === undefined || isNaN(Number(val)))) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or missing parameters: currentAge, retirementAge, monthlyExpenses, inflationRate, existingSavings, expectedReturn'
                });
                return;
            }

            const projection = ProjectionService.generateRetirementGlidePath({
                currentAge: Number(currentAge),
                retirementAge: Number(retirementAge),
                monthlyExpenses: Number(monthlyExpenses),
                inflationRate: Number(inflationRate),
                existingSavings: Number(existingSavings),
                expectedReturn: Number(expectedReturn),
                postRetirementReturn: postRetirementReturn ? Number(postRetirementReturn) : undefined
            });

            res.json({ success: true, data: projection });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/projections/goal
     * Generate goal funding timeline
     */
    static getGoalFundingTimeline(req: Request, res: Response) {
        try {
            const { goalName, goalYear, currentCost, inflation, currentSavings, returnRate } = req.body;

            const required = [goalYear, currentCost, inflation, currentSavings, returnRate];
            if (required.some(val => val === undefined || isNaN(Number(val)))) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or missing parameters: goalYear, currentCost, inflation, currentSavings, returnRate'
                });
                return;
            }

            const projection = ProjectionService.generateGoalFundingTimeline({
                goalName: goalName || 'Goal',
                goalYear: Number(goalYear),
                currentCost: Number(currentCost),
                inflation: Number(inflation),
                currentSavings: Number(currentSavings),
                returnRate: Number(returnRate)
            });

            res.json({ success: true, data: projection });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/projections/report
     * Generate bundled projections using user profile defaults
     */
    static async getReportBundle(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const userId = user?.id || user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }

            // Fetch user profile for default values
            const profile = await ProfileModel.findByUserId(userId);
            if (!profile) {
                res.status(404).json({ success: false, message: 'Profile not found' });
                return;
            }

            // Build default parameters from profile
            const currentAge = profile.age || 30;
            const monthlyIncome = (profile.gross_income || 0) / 12;
            const monthlyExpenses = profile.fixed_expenses || 0;
            const existingSavings = profile.existing_assets || 0;

            // Generate SIP projection (default: 10% of income, 12% return, 20 years)
            const sipProjection = ProjectionService.generateSIPProjection({
                monthlyInvestment: Math.round(monthlyIncome * 0.1),
                rate: 12,
                years: 20
            });

            // Generate retirement glide path using profile data
            let retirementProjection = null;
            if (currentAge < 60) {
                try {
                    retirementProjection = ProjectionService.generateRetirementGlidePath({
                        currentAge,
                        retirementAge: 60,
                        monthlyExpenses,
                        inflationRate: 6,
                        existingSavings,
                        expectedReturn: 12
                    });
                } catch {
                    // Skip if calculation fails (e.g., invalid age)
                }
            }

            // Bundle response
            const bundle = {
                sip: sipProjection,
                retirement: retirementProjection,
                goals: [], // Can be extended with user-specific goals
                generatedAt: new Date().toISOString(),
                basedOnProfile: {
                    age: currentAge,
                    monthlyIncome: Math.round(monthlyIncome),
                    monthlyExpenses,
                    existingSavings
                }
            };

            res.json({ success: true, data: bundle });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
