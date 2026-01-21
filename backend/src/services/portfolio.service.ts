import db from '../config/database';
import { UserPortfolioModel } from '../models/userPortfolio.model';
import { PortfolioHoldingModel } from '../models/portfolioHolding.model';
import { HoldingMetadataModel } from '../models/holdingMetadata.model';
import { MutualFundService } from './mutualFund.service';
import { computePortfolioAnalytics } from './portfolioAnalytics.service';
import { HoldingInput, PortfolioAnalyticsResult } from '../types/portfolioAnalytics';
import { HoldingSource } from '../types/holdingSource';
import logger from '../config/logger';

// ISIN validation regex: 2 uppercase letters + 9 alphanumeric + 1 check digit
const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

export interface ManualHoldingInput {
    isin: string;
    asset_type: 'EQUITY' | 'MUTUAL_FUND';
    quantity: number;
}

export interface CSVRow {
    isin: string;
    asset_type: string;
    quantity: string;
}

export class PortfolioService {
    /**
     * Validate ISIN format
     */
    static isValidISIN(isin: string): boolean {
        return ISIN_REGEX.test(isin);
    }

    /**
     * Check if user already has this ISIN in any portfolio
     */
    static async isDuplicateISIN(userId: string, isin: string): Promise<boolean> {
        const result = await db.query(
            `SELECT ph.id FROM portfolio_holdings ph
             JOIN user_portfolios up ON ph.portfolio_id = up.id
             WHERE up.user_id = $1 AND ph.isin = $2`,
            [userId, isin]
        );
        return result.rows.length > 0;
    }

    /**
     * Get or create user's default portfolio
     */
    static async getOrCreateDefaultPortfolio(userId: string): Promise<string> {
        const portfolios = await UserPortfolioModel.findByUserId(userId);

        if (portfolios.length > 0) {
            return portfolios[0].id;
        }

        const newPortfolio = await UserPortfolioModel.create({
            user_id: userId,
            portfolio_alias: 'Main Portfolio',
            source: 'MANUAL'
        });

        return newPortfolio.id;
    }

    /**
     * Ensure holding metadata exists, create with NAV for MUTUAL_FUND
     */
    static async ensureMetadataExists(
        isin: string,
        assetType: 'EQUITY' | 'MUTUAL_FUND'
    ): Promise<{ nav: number | null; name: string }> {
        const existing = await HoldingMetadataModel.findByIsin(isin);

        if (existing) {
            return {
                nav: existing.current_nav || null,
                name: existing.name
            };
        }

        // For MUTUAL_FUND, fetch NAV from API
        if (assetType === 'MUTUAL_FUND') {
            const navData = await MutualFundService.getNavByIsin(isin);

            if (navData && navData.nav !== null) {
                // Create metadata with NAV data
                await HoldingMetadataModel.create({
                    isin,
                    name: navData.name,
                    type: assetType,
                    current_nav: navData.nav,
                    nav_date: navData.date ? new Date(navData.date) : undefined
                });
                logger.info(`Created MF metadata with NAV for ISIN: ${isin}`, { nav: navData.nav });
                return { nav: navData.nav, name: navData.name };
            }
        }

        // Fallback: create stub metadata without NAV
        await HoldingMetadataModel.create({
            isin,
            name: `Unknown ${assetType} (${isin})`,
            type: assetType
        });
        logger.info(`Created stub metadata for ISIN: ${isin}`);
        return { nav: null, name: `Unknown ${assetType} (${isin})` };
    }

    /**
     * Add a single holding manually
     */
    static async addManualHolding(userId: string, input: ManualHoldingInput): Promise<{ success: boolean; message: string; data?: any }> {
        const { isin, asset_type, quantity } = input;

        // Validate ISIN format
        if (!this.isValidISIN(isin)) {
            return { success: false, message: `Invalid ISIN format: ${isin}` };
        }

        // Validate quantity
        if (quantity <= 0) {
            return { success: false, message: 'Quantity must be greater than 0' };
        }

        // Validate asset type
        if (!['EQUITY', 'MUTUAL_FUND'].includes(asset_type)) {
            return { success: false, message: 'Asset type must be EQUITY or MUTUAL_FUND' };
        }

        // Check for duplicate
        if (await this.isDuplicateISIN(userId, isin)) {
            return { success: false, message: `ISIN ${isin} already exists in your portfolio` };
        }

        // Ensure metadata exists and get NAV
        const { nav } = await this.ensureMetadataExists(isin, asset_type);

        // Get or create portfolio
        const portfolioId = await this.getOrCreateDefaultPortfolio(userId);

        // Compute valuation for MUTUAL_FUND
        const valuation = (asset_type === 'MUTUAL_FUND' && nav !== null)
            ? parseFloat((quantity * nav).toFixed(2))
            : undefined;

        // Create holding with valuation and source
        const holding = await PortfolioHoldingModel.create({
            portfolio_id: portfolioId,
            isin,
            quantity,
            last_valuation: valuation,
            source: 'MANUAL' as HoldingSource
        });

        logger.info(`Added holding ${isin} for user ${userId}`, { nav, valuation, source: 'MANUAL' });

        return { success: true, message: 'Holding added successfully', data: holding };
    }

    /**
     * Parse and validate CSV content
     */
    static parseCSV(csvContent: string): { valid: CSVRow[]; errors: string[] } {
        const lines = csvContent.trim().split('\n');
        const valid: CSVRow[] = [];
        const errors: string[] = [];

        if (lines.length < 2) {
            errors.push('CSV must have a header row and at least one data row');
            return { valid, errors };
        }

        // Validate header
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        if (!header.includes('isin') || !header.includes('asset_type') || !header.includes('quantity')) {
            errors.push('CSV must have headers: isin, asset_type, quantity');
            return { valid, errors };
        }

        const isinIdx = header.indexOf('isin');
        const typeIdx = header.indexOf('asset_type');
        const qtyIdx = header.indexOf('quantity');

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());

            if (cols.length < 3) {
                errors.push(`Row ${i + 1}: Insufficient columns`);
                continue;
            }

            const row: CSVRow = {
                isin: cols[isinIdx].toUpperCase(),
                asset_type: cols[typeIdx].toUpperCase(),
                quantity: cols[qtyIdx]
            };

            // Validate row
            if (!this.isValidISIN(row.isin)) {
                errors.push(`Row ${i + 1}: Invalid ISIN format '${row.isin}'`);
                continue;
            }

            if (!['EQUITY', 'MUTUAL_FUND'].includes(row.asset_type)) {
                errors.push(`Row ${i + 1}: Invalid asset_type '${row.asset_type}'`);
                continue;
            }

            const qty = parseFloat(row.quantity);
            if (isNaN(qty) || qty <= 0) {
                errors.push(`Row ${i + 1}: Quantity must be a positive number`);
                continue;
            }

            valid.push(row);
        }

        return { valid, errors };
    }

    /**
     * Upload holdings from CSV
     */
    static async uploadCSV(userId: string, csvContent: string): Promise<{ success: boolean; message: string; imported: number; errors: string[] }> {
        const { valid, errors } = this.parseCSV(csvContent);

        if (valid.length === 0) {
            return { success: false, message: 'No valid rows to import', imported: 0, errors };
        }

        const portfolioId = await this.getOrCreateDefaultPortfolio(userId);
        let imported = 0;

        for (const row of valid) {
            const assetType = row.asset_type as 'EQUITY' | 'MUTUAL_FUND';
            const quantity = parseFloat(row.quantity);

            // Check duplicate
            if (await this.isDuplicateISIN(userId, row.isin)) {
                errors.push(`Skipped duplicate ISIN: ${row.isin}`);
                continue;
            }

            // Ensure metadata and get NAV (fetches from API for MUTUAL_FUND)
            const { nav } = await this.ensureMetadataExists(row.isin, assetType);

            // Compute valuation for MUTUAL_FUND
            const valuation = (assetType === 'MUTUAL_FUND' && nav !== null)
                ? parseFloat((quantity * nav).toFixed(2))
                : undefined;

            // Create holding with valuation and source
            await PortfolioHoldingModel.create({
                portfolio_id: portfolioId,
                isin: row.isin,
                quantity,
                last_valuation: valuation,
                source: 'CSV' as HoldingSource
            });

            imported++;
        }

        // Update sync metadata
        const syncStatus = errors.length > 0 ? 'PARTIAL' : 'SUCCESS';
        await UserPortfolioModel.updateSyncStatus(portfolioId, syncStatus, 'CSV');

        logger.info(`CSV import: ${imported} holdings for user ${userId}`);

        return {
            success: imported > 0,
            message: imported > 0 ? `Imported ${imported} holdings` : 'No new holdings imported',
            imported,
            errors
        };
    }

    /**
     * Get all holdings for a user with metadata
     */
    static async getHoldings(userId: string): Promise<any[]> {
        return PortfolioHoldingModel.findByUserIdWithMetadata(userId);
    }

    /**
     * Delete a holding (validates ownership)
     */
    static async deleteHolding(userId: string, holdingId: string): Promise<{ success: boolean; message: string }> {
        // Verify ownership
        const result = await db.query(
            `SELECT ph.id FROM portfolio_holdings ph
             JOIN user_portfolios up ON ph.portfolio_id = up.id
             WHERE ph.id = $1 AND up.user_id = $2`,
            [holdingId, userId]
        );

        if (result.rows.length === 0) {
            return { success: false, message: 'Holding not found or access denied' };
        }

        await PortfolioHoldingModel.delete(holdingId);
        logger.info(`Deleted holding ${holdingId} for user ${userId}`);

        return { success: true, message: 'Holding deleted successfully' };
    }

    /**
     * Get portfolio summary (total valuation) with sync metadata
     */
    static async getPortfolioSummary(userId: string): Promise<{
        totalValuation: number;
        holdingsCount: number;
        syncMetadata?: {
            last_synced_at: Date;
            sync_status: string;
            sync_source: string;
        };
    }> {
        const holdings = await this.getHoldings(userId);
        const totalValuation = await PortfolioHoldingModel.getTotalValuationByUserId(userId);

        // Get sync metadata from user's default portfolio
        const portfolios = await UserPortfolioModel.findByUserId(userId);
        let syncMetadata = undefined;
        if (portfolios.length > 0) {
            const metadata = await UserPortfolioModel.getSyncMetadata(portfolios[0].id);
            if (metadata) {
                syncMetadata = metadata;
            }
        }

        return {
            totalValuation,
            holdingsCount: holdings.length,
            syncMetadata
        };
    }

    /**
     * Get comprehensive portfolio analytics
     * Stateless computation - reusable for reports
     */
    static async getPortfolioAnalytics(userId: string): Promise<PortfolioAnalyticsResult> {
        // Fetch holdings with metadata
        const rawHoldings = await this.getHoldings(userId);

        // Transform to analytics input format
        const holdingInputs: HoldingInput[] = rawHoldings.map(h => ({
            isin: h.isin,
            quantity: parseFloat(h.quantity) || 0,
            average_price: h.average_price ? parseFloat(h.average_price) : undefined,
            last_valuation: h.last_valuation ? parseFloat(h.last_valuation) : undefined,
            name: h.name,
            type: h.type as 'EQUITY' | 'MUTUAL_FUND',
            category: h.category || 'Uncategorized',
            current_nav: h.current_nav ? parseFloat(h.current_nav) : undefined
        }));

        // Compute analytics using stateless engine
        const analytics = computePortfolioAnalytics(holdingInputs);

        logger.info(`Computed portfolio analytics for user ${userId}`, {
            totalValue: analytics.totalValue,
            holdingsCount: analytics.holdingDetails.length,
            riskFlags: analytics.concentrationRisks.length
        });

        return analytics;
    }

    /**
     * Upload holdings from CAS PDF
     */
    static async uploadCASHoldings(
        userId: string,
        casHoldings: Array<{ isin: string; schemeName: string; units: number; nav?: number; value?: number }>
    ): Promise<{ imported: number; skipped: number; errors: string[] }> {
        const errors: string[] = [];
        let imported = 0;
        let skipped = 0;

        const portfolioId = await this.getOrCreateDefaultPortfolio(userId);

        for (const holding of casHoldings) {
            const { isin, schemeName, units, nav, value } = holding;

            // Validate ISIN
            if (!this.isValidISIN(isin)) {
                errors.push(`Invalid ISIN format: ${isin}`);
                skipped++;
                continue;
            }

            // Check for duplicate
            if (await this.isDuplicateISIN(userId, isin)) {
                errors.push(`Skipped duplicate ISIN: ${isin}`);
                skipped++;
                continue;
            }

            // Ensure metadata exists
            const existing = await HoldingMetadataModel.findByIsin(isin);
            if (!existing) {
                // Create metadata from CAS data
                await HoldingMetadataModel.create({
                    isin,
                    name: schemeName,
                    type: 'MUTUAL_FUND',
                    current_nav: nav,
                    nav_date: nav ? new Date() : undefined
                });
            }

            // Compute valuation
            const valuation = value || (nav && units ? parseFloat((units * nav).toFixed(2)) : undefined);

            // Create holding with source = 'CAS'
            await PortfolioHoldingModel.create({
                portfolio_id: portfolioId,
                isin,
                quantity: units,
                last_valuation: valuation,
                source: 'CAS' as HoldingSource
            });

            imported++;
        }

        // Update sync metadata
        const syncStatus = errors.length > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'SUCCESS';
        await UserPortfolioModel.updateSyncStatus(portfolioId, syncStatus, 'CAS');

        logger.info(`CAS import: ${imported} holdings for user ${userId}`, { skipped, errors: errors.length });

        return { imported, skipped, errors };
    }
}

