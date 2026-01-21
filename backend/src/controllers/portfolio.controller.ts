import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAlignmentService } from '../services/portfolioAlignment.service';
import { ProfileModel } from '../models/profile.model';
import { SurveyModel } from '../models/survey.model';
import logger from '../config/logger';

export class PortfolioController {
    /**
     * Add a single holding manually
     * POST /api/portfolio/manual
     */
    static async addManualHolding(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { isin, asset_type, quantity } = req.body;

            if (!isin || !asset_type || quantity === undefined) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: isin, asset_type, quantity'
                });
                return;
            }

            const result = await PortfolioService.addManualHolding(userId, {
                isin: isin.toUpperCase(),
                asset_type: asset_type.toUpperCase(),
                quantity: parseFloat(quantity)
            });

            if (!result.success) {
                res.status(400).json(result);
                return;
            }

            res.status(201).json(result);
        } catch (error: any) {
            logger.error('Add Manual Holding Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add holding'
            });
        }
    }

    /**
     * Upload holdings via CSV
     * POST /api/portfolio/upload-csv
     */
    static async uploadCSV(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { csv } = req.body;

            if (!csv || typeof csv !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Missing or invalid CSV content in request body'
                });
                return;
            }

            const result = await PortfolioService.uploadCSV(userId, csv);

            if (!result.success) {
                res.status(400).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Upload CSV Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process CSV upload'
            });
        }
    }

    /**
     * Get all user holdings with metadata
     * GET /api/portfolio/holdings
     */
    static async getHoldings(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const holdings = await PortfolioService.getHoldings(userId);
            const summary = await PortfolioService.getPortfolioSummary(userId);

            res.status(200).json({
                success: true,
                data: {
                    holdings,
                    summary
                }
            });
        } catch (error: any) {
            logger.error('Get Holdings Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve holdings'
            });
        }
    }

    /**
     * Delete a holding
     * DELETE /api/portfolio/holdings/:id
     */
    static async deleteHolding(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Holding ID is required'
                });
                return;
            }

            const result = await PortfolioService.deleteHolding(userId, id);

            if (!result.success) {
                res.status(404).json(result);
                return;
            }

            // Wrap in data for consistency with response interceptor
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error('Delete Holding Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete holding'
            });
        }
    }

    /**
     * Get portfolio alignment analysis
     * GET /api/portfolio/alignment
     */
    static async getAlignment(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // Fetch user's persona and risk class
            const profile = await ProfileModel.findByUserId(userId);
            const surveyData = await SurveyModel.findByUserId(userId);

            const personaData = profile?.persona_data as any;
            const persona = personaData?.persona?.name || 'General';
            const riskClass = surveyData?.[0]?.final_class || undefined;

            // Run alignment analysis
            const alignment = await PortfolioAlignmentService.analyzeAlignment(userId, persona, riskClass);

            res.status(200).json({
                success: true,
                data: alignment
            });
        } catch (error: any) {
            logger.error('Get Alignment Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve portfolio alignment'
            });
        }
    }

    /**
     * Upload holdings from CAS PDF
     * POST /api/portfolio/upload-cas
     */
    static async uploadCAS(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const file = (req as any).file as Express.Multer.File | undefined;
            const { password } = req.body;

            // Validate file upload
            if (!file) {
                res.status(400).json({
                    success: false,
                    message: 'No CAS PDF file provided'
                });
                return;
            }

            // Import CAS parser dynamically to avoid circular dependencies
            const { parseCASPdf } = await import('../services/casParser.service');

            // Parse CAS PDF
            const parseResult = await parseCASPdf(file.buffer, password);

            if (!parseResult.success && parseResult.holdings.length === 0) {
                res.status(400).json({
                    success: false,
                    message: parseResult.errors[0] || 'Failed to parse CAS PDF',
                    errors: parseResult.errors
                });
                return;
            }

            // Import holdings into portfolio
            const importResult = await PortfolioService.uploadCASHoldings(userId, parseResult.holdings);

            res.status(200).json({
                success: importResult.imported > 0,
                message: importResult.imported > 0
                    ? `Imported ${importResult.imported} holdings from CAS`
                    : 'No new holdings imported',
                data: {
                    totalFound: parseResult.totalFound,
                    imported: importResult.imported,
                    skipped: importResult.skipped,
                    errors: [...parseResult.errors, ...importResult.errors]
                }
            });
        } catch (error: any) {
            logger.error('Upload CAS Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process CAS PDF upload'
            });
        }
    }
}
