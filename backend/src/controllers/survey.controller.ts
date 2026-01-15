import { Request, Response } from 'express';
import { RISK_QUESTIONS } from '../config/questions';
import { RiskService, SurveyResponse } from '../services/risk.service';
import { HealthService } from '../services/health.service';
import { SurveyModel } from '../models/survey.model';
import { ProfileModel } from '../models/profile.model'; // To update user risk profile
import logger from '../config/logger';

export class SurveyController {

    // Get all survey questions
    static getQuestions(_req: Request, res: Response) {
        res.status(200).json({
            success: true,
            data: RISK_QUESTIONS
        });
    }

    // Submit survey responses
    static async submitSurvey(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const responses: SurveyResponse[] = req.body.responses;

            if (!responses || !Array.isArray(responses)) {
                res.status(400).json({ success: false, message: 'Invalid responses format' });
                return;
            }

            // 1. Calculate Score
            const score = RiskService.calculateScore(responses);
            const riskClass = RiskService.determineRiskClass(score);

            // 2. Check Contradictions
            const contradictions = RiskService.detectContradictions(responses);

            // GUARDRAIL: Downgrade risk class if contradictions found
            let finalRiskClass = riskClass;
            if (contradictions.length > 0) {
                if (riskClass === 'Aggressive') finalRiskClass = 'Moderate';
                else if (riskClass === 'Moderate') finalRiskClass = 'Conservative';
                // Conservative stays Conservative

                logger.info(`Downgraded Risk Class for user ${userId} from ${riskClass} to ${finalRiskClass} due to contradictions.`);
            }

            // If significant contradictions, maybe warn user? 
            // For now, we save but return warnings.

            // 3. Save Survey Result
            const savedSurvey = await SurveyModel.create({
                user_id: userId,
                responses: responses,
                total_score: score,
                final_class: finalRiskClass
            });

            // 4. Update Financial Profile with new Risk Score
            // Check if profile exists; if so update, else create partial? 
            // Usually profile exists from onboarding.
            const profile = await ProfileModel.findByUserId(userId);
            if (profile) {
                await ProfileModel.update(userId, {
                    risk_score: score,
                    risk_class: finalRiskClass
                });
            } else {
                // Let's create if missing to be safe.
                await ProfileModel.create({
                    user_id: userId,
                    risk_score: score,
                    risk_class: finalRiskClass
                });
            }

            // Recalculate Health Score
            await HealthService.recalculate(userId);

            res.status(200).json({
                success: true,
                message: 'Risk profile calculated successfully',
                data: {
                    score,
                    riskClass: finalRiskClass,
                    contradictions,
                    surveyId: savedSurvey.id
                }
            });

        } catch (error: any) {
            logger.error('Survey Submit Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process survey'
            });
        }
    }
}
