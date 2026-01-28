import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import logger from '../config/logger';

export class AnalyticsController {
    /**
     * Get comprehensive portfolio snapshot
     * GET /api/analytics/portfolio-snapshot
     */
    static async getPortfolioSnapshot(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const snapshot = await AnalyticsService.getPortfolioSnapshot(userId);

            res.status(200).json({
                success: true,
                data: snapshot
            });
        } catch (error: any) {
            logger.error('Portfolio snapshot error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate portfolio snapshot'
            });
        }
    }
}
