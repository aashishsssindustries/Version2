import { Request, Response } from 'express';
import { MarketplaceService } from '../services/marketplace.service';
import logger from '../config/logger';

export class MarketplaceController {
    static async getRecommendations(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const products = await MarketplaceService.getRecommendations(userId);

            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error: any) {
            logger.error('Marketplace Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch marketplace recommendations'
            });
        }
    }
}
