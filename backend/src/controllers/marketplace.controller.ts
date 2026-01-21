import { Request, Response } from 'express';
import { MarketplaceService } from '../services/marketplace.service';
import { MarketplaceDiscoveryService } from '../services/marketplace-discovery.service';
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

    /**
     * Discovery Endpoints
     */

    static getCatalog(req: Request, res: Response) {
        try {
            // Extract filters from query params
            const filters = {
                category: req.query.category as any,
                riskLevel: req.query.riskLevel as any,
                assetClass: req.query.assetClass as any,
                fundHouse: req.query.fundHouse as string,
                minInvestmentMax: req.query.minInvestmentMax ? Number(req.query.minInvestmentMax) : undefined,
                tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
            };

            const products = MarketplaceDiscoveryService.getCatalog(filters);
            res.json({ success: true, count: products.length, data: products });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static getProductDetail(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // Check if it's an ISIN or ID
            const byId = MarketplaceDiscoveryService.getProductById(id);
            const byIsin = MarketplaceDiscoveryService.getProductByIsin(id);

            const product = byId || byIsin;

            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }

            res.json({ success: true, data: product });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static searchProducts(req: Request, res: Response) {
        try {
            const query = req.query.q as string;
            if (!query) {
                res.json({ success: true, data: [] });
                return;
            }
            const results = MarketplaceDiscoveryService.searchProducts(query);
            res.json({ success: true, count: results.length, data: results });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static getCategories(_req: Request, res: Response) {
        try {
            const categories = MarketplaceDiscoveryService.getCategories();
            res.json({ success: true, data: categories });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static getFilters(_req: Request, res: Response) {
        try {
            const filters = MarketplaceDiscoveryService.getFilterOptions();
            res.json({ success: true, data: filters });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
