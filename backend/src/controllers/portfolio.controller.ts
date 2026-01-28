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
            console.log('Alignment Request for user:', userId);

            // Fetch user's persona and risk class
            const profile = await ProfileModel.findByUserId(userId);
            const surveyData = await SurveyModel.findByUserId(userId);

            const personaData = profile?.persona_data as any;
            const persona = personaData?.persona?.name || 'General';
            // Fallback to profile risk_class if survey not found (e.g. for seeded users)
            const riskClass = surveyData?.[0]?.final_class || profile?.risk_class || undefined;

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
     * Upload holdings and transactions from CAS PDF
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

            // Import services dynamically to avoid circular dependencies
            const { parseCASPdf } = await import('../services/casParser.service');
            const { TransactionService } = await import('../services/transaction.service');

            // Parse CAS PDF
            const parseResult = await parseCASPdf(file.buffer, password);

            if (!parseResult.success && parseResult.holdings.length === 0 && parseResult.transactions.length === 0) {
                res.status(400).json({
                    success: false,
                    message: parseResult.errors[0] || 'Failed to parse CAS PDF',
                    errors: parseResult.errors
                });
                return;
            }

            // Import holdings into portfolio
            const holdingResult = await PortfolioService.uploadCASHoldings(userId, parseResult.holdings);

            // Import transactions
            const transactionResult = await TransactionService.importCASTransactions(userId, parseResult.transactions);

            const allErrors = [
                ...parseResult.errors,
                ...holdingResult.errors,
                ...transactionResult.errors
            ];

            const totalImported = holdingResult.imported + transactionResult.imported;

            res.status(200).json({
                success: totalImported > 0,
                message: totalImported > 0
                    ? `Imported ${holdingResult.imported} holdings and ${transactionResult.imported} transactions from CAS`
                    : 'No new data imported',
                data: {
                    holdings: {
                        totalFound: parseResult.totalHoldingsFound,
                        imported: holdingResult.imported,
                        skipped: holdingResult.skipped
                    },
                    transactions: {
                        totalFound: parseResult.totalTransactionsFound,
                        imported: transactionResult.imported,
                        skipped: transactionResult.skipped
                    },
                    errors: allErrors
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

    /**
     * Get Portfolio Analytics Snapshot
     * GET /api/portfolio/analytics-snapshot
     */
    static async getAnalyticsSnapshot(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { AnalyticsSnapshotService } = await import('../services/analyticsSnapshot.service');
            const snapshot = await AnalyticsSnapshotService.getSnapshot(userId);

            res.status(200).json({
                success: true,
                data: snapshot
            });
        } catch (error: any) {
            logger.error('Get Analytics Snapshot Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve analytics snapshot'
            });
        }
    }

    /**
     * Generate and download Advisory PDF Report
     * GET /api/portfolio/report/pdf
     */
    static async downloadReport(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // 1. Fetch Centralized Snapshot
            const { AnalyticsSnapshotService } = await import('../services/analyticsSnapshot.service');
            const snapshot = await AnalyticsSnapshotService.getSnapshot(userId);

            // 2. Prepare Data for Report Service (Adapter Layer)
            // Adapt the snapshot structure to what the template expects

            const reportData = {
                userName: snapshot.meta.userName,
                reportDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                reportId: `WM-${Date.now().toString().slice(-6)}`,
                totalValuation: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(snapshot.summary.netWorth),
                xirr: snapshot.summary.xirr,
                riskScore: snapshot.risk.score,
                allocationDataJson: JSON.stringify(snapshot.charts.assetAllocation),
                performanceDataJson: JSON.stringify(snapshot.charts.performance),
                holdings: snapshot.topHoldings.map(h => ({
                    name: h.name,
                    type: h.type === 'MUTUAL_FUND' ? 'MF' : 'EQ',
                    typeColor: h.type === 'MUTUAL_FUND' ? '#6366f1' : '#10b981',
                    quantity: '-', // Snapshot might not have quantity in topHoldings if we didn't put it there. Let's add it to service or just omit for summary.
                    value: h.value.toLocaleString('en-IN'),
                    percent: h.percent.toFixed(1)
                })),
                recommendationText: snapshot.risk.flags?.[0]?.message || "Maintain current allocation. Portfolio is well-aligned with your risk profile."
            };

            // 3. Generate PDF
            const { ReportService } = await import('../services/report.service');
            const pdfBuffer = await ReportService.generateAdvisoryReport(reportData);

            // 4. Send Response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=wealth_report.pdf');
            res.send(pdfBuffer);

        } catch (error: any) {
            logger.error('Download Report Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report'
            });
        }
    }
}
