import { Request, Response } from 'express';
import { ProfileModel } from '../models/profile.model';
import { ProfilingService, FinancialInput } from '../services/profiling.service';
import { HealthService } from '../services/health.service';
import { SurveyModel } from '../models/survey.model';
import { NextBestActionService } from '../services/nextBestAction.service';
import logger from '../config/logger';

export class ProfileController {

    // Create or Update Profile (Upsert logic often better, but keeping simple)
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id; // From Auth Middleware
            const input: FinancialInput = req.body;

            // Fetch user's survey risk class
            const surveyData = await SurveyModel.findByUserId(userId);
            const riskClass = surveyData?.[0]?.final_class || undefined;

            // 1. Run Profiling Logic with Risk Class
            console.log('Input emergency_fund_amount:', (input as any).emergency_fund_amount);
            console.log('Input existing_assets:', input.existing_assets);
            const analysis = ProfilingService.analyze(input, riskClass);
            console.log('Analysis Result:', analysis);

            const profileData = {
                user_id: userId,
                age: input.age,
                employment_type: (input as any).employment_type,
                gross_income: input.gross_income,
                monthly_emi: input.monthly_emi,
                fixed_expenses: input.fixed_expenses,
                insurance_premium: input.insurance_premium,
                total_liabilities: input.total_liabilities,
                existing_assets: input.existing_assets,
                persona_data: analysis,
                asset_types: (input as any).asset_types,
                insurance_coverage: (input as any).insurance_coverage,
                pan_number: (input as any).pan_number,
                // New fields that were missing
                emergency_fund_amount: (input as any).emergency_fund_amount,
                insurance_cover: (input as any).insurance_cover,
                dependents: (input as any).dependents
            };

            // 2. Check if profile exists and update FIRST
            const existing = await ProfileModel.findByUserId(userId);

            if (existing) {
                await ProfileModel.update(userId, profileData);
                logger.debug('Profile updated successfully', { userId });
            } else {
                await ProfileModel.create(profileData);
                logger.debug('Profile created successfully', { userId });
            }

            // [COMPLIANCE] Audit Log
            const { AuditService } = await import('../services/audit.service');
            await AuditService.log({
                userId,
                action: existing ? 'UPDATE_PROFILE' : 'CREATE_PROFILE',
                resource: 'profile',
                details: { riskClass, persona: analysis?.persona?.name },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            // 3. Extract Recommendations and Save Action Items (non-blocking)
            const recommendations = analysis.recommendations || [];
            try {
                await ProfileModel.saveActionItems(userId, recommendations);
                logger.debug('Action items saved', { count: recommendations.length });
            } catch (actionError: any) {
                logger.warn('Failed to save action items, continuing...', { error: actionError.message });
            }

            // 4. Recalculate Health Score
            let savedProfile = await HealthService.recalculate(userId);

            if (!savedProfile) {
                throw new Error('Failed to recalculate health score');
            }

            // 5. Save Score History
            try {
                const { ScoreHistoryModel } = await import('../models/scoreHistory.model');
                const personaLabel = (savedProfile.persona_data as any)?.persona?.name;
                await ScoreHistoryModel.saveScore(userId, savedProfile.health_score, personaLabel);
                logger.debug('Score history saved', { score: savedProfile.health_score });
            } catch (historyError: any) {
                logger.warn('Failed to save score history', { error: historyError.message });
            }

            // 6. Map recommendations to frontend structure
            const actions = recommendations.map(rec => ({
                id: rec.id,
                title: rec.title,
                description: rec.description,
                category: rec.category,
                priority: rec.priority,
                gap_amount: rec.gap || 0,
                estimated_score_impact: parseInt(rec.scoreImpact?.replace(/\D/g, '') || '0'),
                action: rec.action,
                linked_tool: rec.linked_tool,
                persona_context: rec.persona_context,
                risk_type: rec.type
            }));

            const responseData = { ...savedProfile, action_items: actions };

            res.status(200).json({
                success: true,
                message: 'Profile updated with persona analysis',
                data: responseData
            });

        } catch (error: any) {
            logger.error('Profile Update Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile'
            });
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await ProfileModel.findByUserId(userId);

            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
                return;
            }

            // Inject Gamification Stats
            // Extract Label from persona_data which is JSONB. 
            // In ProfilingResult, persona.id gives 'A'/'B'/'C'.
            // persona.name gives 'Early Career Builder' etc.
            const personaData = profile.persona_data as any;
            const personaLabel = personaData?.persona?.name || 'General';

            const stats = await ProfileModel.getStats(profile.health_score || 0, personaLabel);

            // Fetch user's survey risk class
            const surveyData = await SurveyModel.findByUserId(userId);
            const riskClass = surveyData?.[0]?.final_class || undefined;

            // Generate Action Items on-the-fly to get rich text (Title, Desc, Action)
            const input: FinancialInput = {
                gross_income: profile.gross_income,
                monthly_emi: profile.monthly_emi,
                fixed_expenses: profile.fixed_expenses,
                existing_assets: profile.existing_assets,
                total_liabilities: profile.total_liabilities,
                insurance_premium: profile.insurance_premium,
                insurance_coverage: profile.insurance_coverage,
                emergency_fund_amount: profile.emergency_fund_amount // Add this field!
            };
            const analysis = ProfilingService.analyze(input, riskClass);
            const rawRecommendations = analysis.recommendations || [];

            // Map to the structure expected by Frontend
            const actions = rawRecommendations.map(rec => ({
                id: rec.id,
                title: rec.title,
                description: rec.description,
                category: rec.category,
                priority: rec.priority,
                gap_amount: rec.gap || 0,
                estimated_score_impact: parseInt(rec.scoreImpact?.replace(/\D/g, '') || '0'),
                action: rec.action,
                linked_tool: rec.linked_tool,
                persona_context: rec.persona_context,
                risk_type: rec.type
            }));

            res.status(200).json({
                success: true,
                data: {
                    ...profile,
                    action_items: actions,
                    gamification: {
                        percentile: stats.percentile,
                        benchmark: personaLabel === 'General' ? 'All Users' : `Similar ${personaLabel}s`,
                        count: stats.count
                    }
                }
            });

        } catch (error: any) {
            logger.error('Get Profile Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve profile'
            });
        }
    }

    static async updateActionItemStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'completed', 'dismissed'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const updated = await ProfileModel.updateActionItemStatus(id, status, userId);

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Action item not found' });
            }

            return res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Action Update Error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Get Next Best Action for user
     */
    static async getNextBestAction(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await ProfileModel.findByUserId(userId);

            const nextAction = NextBestActionService.detectNextBestAction(profile);
            const completionPercent = NextBestActionService.getProfileCompletionPercent(profile);

            res.status(200).json({
                success: true,
                data: {
                    nextAction,
                    profileCompletion: completionPercent
                }
            });

        } catch (error: any) {
            logger.error('Get Next Best Action Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get next best action'
            });
        }
    }

    /**
     * Get score history for trend visualization
     */
    static async getScoreHistory(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const limit = parseInt(req.query.limit as string) || 30;

            const { ScoreHistoryModel } = await import('../models/scoreHistory.model');
            const history = await ScoreHistoryModel.getHistory(userId, limit);

            return res.json({
                success: true,
                data: history
            });
        } catch (error: any) {
            logger.error('Get Score History Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch score history'
            });
        }
    }
    /**
     * Get accessible audit logs for the user
     */
    static async getAuditLogs(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { AuditService } = await import('../services/audit.service');
            const logs = await AuditService.getLogsByUser(userId);

            return res.json({
                success: true,
                data: logs
            });
        } catch (error: any) {
            logger.error('Get Audit Logs Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch security logs'
            });
        }
    }
}
