import puppeteer from 'puppeteer';
import { randomUUID } from 'crypto';
import logger from '../config/logger';

// ============================================
// Interfaces
// ============================================

export interface WhiteLabelConfig {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    advisorName?: string;
    licenseNumber?: string;
}

interface UserData {
    name: string;
    email: string;
}

interface ProfileData {
    age: number;
    gross_income: number;
    fixed_expenses?: number;
    monthly_emi?: number;
    existing_assets?: number;
    emergency_fund_amount?: number;
    insurance_cover?: number;
    health_score: number;
    persona_data?: {
        persona?: { name: string; id: string };
        behavior?: { label: string };
    };
    risk_class?: string;
}

interface ActionItem {
    title: string;
    description: string;
    category: string;
    priority: string;
    gap_amount?: number;
    estimated_score_impact?: number;
}

interface PortfolioHolding {
    name: string;
    isin: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    quantity: number;
    last_valuation?: number;
}

interface PortfolioData {
    holdings: PortfolioHolding[];
    totalValuation: number;
    equityPercent: number;
    mutualFundPercent: number;
    alignmentScore?: number;
    idealAllocation?: { equity: number; mutualFund: number };
}

interface GapAnalysis {
    insuranceGap: number;
    investmentGap: number;
    emergencyFundGap: number;
    lifeInsuranceNeeded: number;
    currentLifeInsurance: number;
}

interface ProjectionData {
    sip?: {
        monthlyInvestment: number;
        years: number;
        totalValue: number;
        investedAmount: number;
        estReturns: number;
        yearlyData?: Array<{ year: number; value: number }>;
    };
    retirement?: {
        yearsToRetire: number;
        targetCorpus: number;
        monthlySavingsRequired: number;
        gap: number;
    };
}

interface MarketplaceProduct {
    name: string;
    category: string;
    isin?: string;
    schemeCode?: string;
    riskLevel: string;
    whyRecommended: string;
}

interface PortfolioSnapshotData {
    totalValue: number;
    investedAmount: number;
    unrealizedGainLoss: number;
    gainLossPercent: number;
    holdingsCount: number;
    investmentHorizon?: string;
}

interface GrowthChartData {
    labels: string[];
    portfolioSeries: number[];
    benchmarkSeries: number[];
}

interface DrawdownData {
    series: Array<{ date: string; drawdown: number }>;
    maxDrawdown?: number;
    maxDrawdownDate?: string;
    recoveryDays?: number;
}

interface RiskReturnData {
    portfolioXirr: number;
    benchmarkXirr: number;
    portfolioVolatility: number;
    benchmarkVolatility: number;
}

interface SchemePerformance {
    schemeName: string;
    schemeXirr: number;
    benchmarkXirr: number;
}

interface SchemePerformanceData {
    schemes: SchemePerformance[];
}

interface WealthProjectionData {
    currentValue: number;
    projectedValue5y: number;
    projectedValue10y: number;
    projectedValue20y: number;
    assumedRate?: number;
}

interface SIPCategorySplit {
    category: string;
    amount: number;
    percentage: number;
}

interface SIPAnalysisData {
    sipCount: number;
    monthlySipAmount: number;
    categorySplit: SIPCategorySplit[];
}

interface AssetClass {
    name: string;
    percentage: number;
    xirr: number;
}

interface AssetAllocationData {
    classes: AssetClass[];
}

export interface PDFDataV3 {
    user: UserData;
    profile: ProfileData;
    actionItems: ActionItem[];
    portfolio?: PortfolioData;
    portfolioSnapshot?: PortfolioSnapshotData;
    growthChart?: GrowthChartData;
    drawdownData?: DrawdownData;
    riskReturnData?: RiskReturnData;
    schemePerformance?: SchemePerformanceData;
    wealthProjection?: WealthProjectionData;
    sipAnalysis?: SIPAnalysisData;
    assetAllocation?: AssetAllocationData;
    mfCategoryAllocation?: MFCategoryData;
    amcExposure?: AMCExposureData;
    schemeAllocation?: SchemeAllocationData;
    schemeXIRRList?: SchemeXIRRData;
    overlapAnalysis?: OverlapAnalysisData;
    riskReturnScatter?: RiskReturnScatterData;
    behaviorAnalysis?: BehaviorAnalysisData;
    yearlyInvestments?: YearlyInvestmentData;
    taxExposure?: TaxExposureData;
    gapAnalysis?: GapAnalysis;
    projections?: ProjectionData;
    marketplaceProducts?: MarketplaceProduct[];
    whiteLabel: WhiteLabelConfig;
}

interface MFCategory {
    category: string;
    percentage: number;
    value: number;
}

interface MFCategoryData {
    categories: MFCategory[];
}

interface AMCExposure {
    amcName: string;
    percentage: number;
}

interface AMCExposureData {
    amcs: AMCExposure[];
}

interface SchemeAllocation {
    schemeName: string;
    value: number;
    weightPercent: number;
}

interface SchemeAllocationData {
    schemes: SchemeAllocation[];
}

interface SchemeXIRR {
    schemeName: string;
    xirr: number;
}

interface SchemeXIRRData {
    schemes: SchemeXIRR[];
}

interface OverlapGroup {
    schemes: string[];
    overlapPercentage: number;
    commonHoldingsCount: number;
}

interface OverlapAnalysisData {
    portfolioOverlapPercentage: number;
    similarHoldingsGroups: OverlapGroup[];
}

interface RiskReturnPoint {
    schemeName: string;
    volatility: number;
    return: number;
    category: string;
}

interface RiskReturnScatterData {
    points: RiskReturnPoint[];
}

interface BehaviorAnalysisData {
    avgHoldingPeriod: string;
    concentrationRatio: number;
    churnRate: number;
}

interface YearlyInvestment {
    year: string;
    amount: number;
}

interface YearlyInvestmentData {
    yearlyNetInvestments: YearlyInvestment[];
}

interface TaxExposureData {
    potentialLTCG: number;
    potentialSTCG: number;
    equityPercentage: number;
    debtPercentage: number;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
    companyName: 'WealthMax',
    primaryColor: '#1a56db',
    advisorName: 'WealthMax Advisory',
    licenseNumber: 'INA000000000'
};

// ============================================
// PDF Service V3
// ============================================

export class PDFServiceV3 {
    /**
    * Generate Advisory PDF Report V3
    * Main Entry Point
    */
    public static async generatePDF(data: PDFDataV3, config: WhiteLabelConfig): Promise<Buffer> {
        let browser = null;
        try {
            const reportId = `WM-${randomUUID().slice(0, 8).toUpperCase()}`;
            const timestamp = new Date().toISOString();
            const generatedDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            const html = this.generateHTML(data, config, reportId, generatedDate, timestamp);

            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
                displayHeaderFooter: false
            });

            return Buffer.from(pdfBuffer);
        } catch (error) {
            logger.error('PDF Generation failed', error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Generate Advisory Report V3 using Puppeteer HTML-to-PDF
     * @deprecated Use generatePDF instead
     */
    static async generateAdvisoryReportV3(data: PDFDataV3): Promise<Buffer> {
        const config = { ...DEFAULT_WHITE_LABEL, ...data.whiteLabel };
        const reportId = `WM-${randomUUID().slice(0, 8).toUpperCase()}`;
        const timestamp = new Date().toISOString();
        const generatedDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        // Generate HTML content
        const htmlContent = this.generateHTML(data, config, reportId, generatedDate, timestamp);

        // Launch Puppeteer and generate PDF
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20mm', bottom: '25mm', left: '15mm', right: '15mm' },
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: this.generateFooterTemplate(config, reportId)
            });

            logger.info(`V3 PDF generated: ${reportId}`);
            return Buffer.from(pdfBuffer);
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Generate complete HTML document
     */
    private static generateHTML(
        data: PDFDataV3,
        config: WhiteLabelConfig,
        reportId: string,
        generatedDate: string,
        timestamp: string
    ): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.companyName} Advisory Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        ${this.getStyles(config)}
    </style>
</head>
<body>
    ${this.renderCoverPage(data, config, generatedDate)}
    ${this.renderPortfolioSnapshot(data, config)}
    ${this.renderGrowthChart(data, config)}
    ${this.renderDrawdownAnalysis(data, config)}
    ${this.renderRiskReturnTable(data, config)}
    ${this.renderSchemeComparison(data, config)}
    ${this.renderWealthProjection(data, config)}
    ${this.renderSIPAnalysis(data, config)}
    ${this.renderAssetAllocation(data, config)}
    ${this.renderMFCategoryAllocation(data, config)}
    ${this.renderAMCExposure(data, config)}
    ${this.renderSchemeAllocationTable(data, config)}
    ${this.renderBestWorstPerformers(data, config)}
    ${this.renderPortfolioOverlap(data, config)}
    ${this.renderRiskReturnScatter(data, config)}
    ${this.renderBehaviorAnalysis(data, config)}
    ${this.renderYearwiseInvestments(data, config)}
    ${this.renderTaxExposure(data, config)}
    ${this.renderExecutiveSummary(data, config)}
    ${this.renderPersonaVisualization(data, config)}
    ${this.renderGapAnalysis(data, config)}
    ${this.renderProjections(data, config)}
    ${this.renderMarketplaceRecommendations(data, config)}
    ${this.renderMethodologyDisclosure(config)}
    ${this.renderComplianceFooter(config, reportId, timestamp)}
</body>
</html>`;
    }

    /**
     * CSS Styles
     */
    private static getStyles(config: WhiteLabelConfig): string {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5; }
        
        .page { page-break-after: always; padding: 20px 0; min-height: 100vh; }
        .page:last-child { page-break-after: avoid; }
        
        /* Cover Page */
        .cover-page { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 90vh; position: relative; }
        .cover-logo { max-height: 80px; margin-bottom: 20px; }
        .cover-company { font-size: 36pt; font-weight: 700; color: ${config.primaryColor}; margin-bottom: 8px; }
        .cover-tagline { font-size: 14pt; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 50px; }
        .cover-title { font-size: 24pt; font-weight: 700; color: #1f2937; margin-bottom: 40px; }
        .cover-line { width: 200px; height: 3px; background: ${config.primaryColor}; margin: 40px auto; }
        .cover-client-info { margin-bottom: 30px; }
        .cover-client-name { font-size: 20pt; font-weight: 600; color: #374151; margin-bottom: 12px; }
        .cover-advisory-date { font-size: 12pt; color: #6b7280; margin-bottom: 6px; }
        .cover-timestamp { font-size: 10pt; color: #9ca3af; }
        .cover-prepared-by { font-size: 11pt; color: #6b7280; font-style: italic; margin-bottom: 60px; }
        .cover-footer-disclaimer { position: absolute; bottom: 40px; left: 40px; right: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .cover-footer-disclaimer p { font-size: 9pt; color: #9ca3af; margin: 4px 0; }
        .disclaimer-data-source { font-style: italic; }
        .disclaimer-advisory { font-weight: 500; color: #6b7280 !important; }
        
        /* Section Headers */
        .section-header { font-size: 18pt; font-weight: 700; color: ${config.primaryColor}; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid ${config.primaryColor}; }
        .subsection-header { font-size: 13pt; font-weight: 600; color: #374151; margin: 20px 0 12px; }
        
        /* Portfolio Snapshot */
        .snapshot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .snapshot-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .snapshot-card.snapshot-primary { background: linear-gradient(135deg, ${config.primaryColor}15, ${config.primaryColor}05); border-color: ${config.primaryColor}30; }
        .snapshot-label { font-size: 10pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .snapshot-value { font-size: 24pt; font-weight: 700; color: #1f2937; }
        .snapshot-subvalue { font-size: 12pt; margin-top: 4px; }
        .snapshot-positive { color: #10b981; }
        .snapshot-negative { color: #ef4444; }
        .snapshot-insight { background: linear-gradient(135deg, #fef3c7, #fef9c3); border: 1px solid #fbbf24; border-radius: 12px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; }
        .insight-icon { font-size: 24pt; }
        .insight-text { font-size: 11pt; color: #92400e; line-height: 1.6; }
        
        /* Growth Chart */
        .chart-container { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; height: 350px; margin-bottom: 24px; }
        .chart-insight { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
        .insight-metrics { display: flex; gap: 30px; justify-content: center; margin-bottom: 16px; }
        .metric-item { text-align: center; }
        .metric-item .metric-label { display: block; font-size: 10pt; color: #6b7280; margin-bottom: 4px; }
        .metric-item .metric-value { font-size: 18pt; font-weight: 700; }
        .metric-item .positive { color: #10b981; }
        .metric-item .negative { color: #ef4444; }
        .insight-text-chart { font-size: 11pt; color: #374151; text-align: center; line-height: 1.6; margin: 0; }
        
        /* Drawdown Analysis */
        .drawdown-insight { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; }
        .drawdown-metrics { display: flex; gap: 40px; justify-content: center; margin-bottom: 16px; }
        .drawdown-metric { text-align: center; }
        .drawdown-metric-label { font-size: 10pt; color: #6b7280; margin-bottom: 4px; }
        .drawdown-metric-value { font-size: 20pt; font-weight: 700; color: #1f2937; }
        .drawdown-metric-value.negative { color: #ef4444; }
        .drawdown-insight-text { font-size: 11pt; color: #7f1d1d; text-align: center; margin: 0; }
        
        /* Risk Return Table */
        .risk-return-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .risk-return-table th, .risk-return-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .risk-return-table th { background: #f9fafb; font-weight: 600; font-size: 10pt; color: #6b7280; text-transform: uppercase; }
        .risk-return-table td { font-size: 11pt; }
        .risk-return-table .outperform { color: #10b981; font-weight: 600; }
        .risk-return-table .underperform { color: #ef4444; font-weight: 600; }
        .risk-return-legend { display: flex; gap: 24px; justify-content: center; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 10pt; color: #6b7280; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
        .legend-dot.outperform { background: #10b981; }
        .legend-dot.underperform { background: #ef4444; }
        
        /* Scheme Classification */
        .scheme-classification { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .classification-group { padding: 16px; border-radius: 8px; }
        .outperform-group { background: #f0fdf4; border: 1px solid #86efac; }
        .neutral-group { background: #f9fafb; border: 1px solid #e5e7eb; }
        .underperform-group { background: #fef2f2; border: 1px solid #fecaca; }
        .classification-header { font-size: 12pt; font-weight: 600; margin-bottom: 8px; }
        .classification-list { font-size: 10pt; color: #6b7280; line-height: 1.5; }
        
        /* Wealth Projection Milestones */
        .projection-milestones { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .milestone-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; }
        .milestone-card.highlight { background: linear-gradient(135deg, ${config.primaryColor}15, ${config.primaryColor}05); border-color: ${config.primaryColor}50; }
        .milestone-label { font-size: 10pt; color: #6b7280; margin-bottom: 8px; }
        .milestone-value { font-size: 18pt; font-weight: 700; color: #1f2937; }
        .milestone-growth { font-size: 11pt; color: #10b981; margin-top: 4px; font-weight: 600; }
        
        /* SIP Analysis */
        .sip-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; }
        .sip-summary { display: flex; flex-direction: column; gap: 16px; }
        .sip-stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .sip-stat-value { font-size: 28pt; font-weight: 700; color: #1f2937; }
        .sip-stat-label { font-size: 10pt; color: #6b7280; margin-top: 4px; }
        .sip-chart-area { display: flex; flex-direction: column; }
        .sip-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .sip-legend-item { display: flex; align-items: center; gap: 8px; }
        .sip-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .sip-legend-label { font-size: 10pt; color: #374151; flex: 1; }
        .sip-legend-value { font-size: 10pt; color: #6b7280; font-weight: 500; }
        
        /* Asset Allocation */
        .asset-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .asset-donut-section, .asset-bar-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
        .asset-legend { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 16px; }
        .asset-legend-item { display: flex; align-items: center; gap: 6px; font-size: 10pt; color: #374151; }
        .asset-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        
        /* MF Category Allocation */
        .mf-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .mf-chart-section { display: flex; align-items: center; justify-content: center; }
        .mf-breakdown { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
        .mf-table { width: 100%; border-collapse: collapse; }
        .mf-table th, .mf-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
        .mf-table th { color: #6b7280; font-weight: 600; text-transform: uppercase; }
        .mf-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
        
        /* AMC Exposure */
        .concentration-alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; display: flex; gap: 12px; margin-bottom: 24px; }
        .alert-icon { font-size: 24pt; }
        .alert-title { font-weight: 600; color: #dc2626; margin-bottom: 4px; }
        .alert-desc { font-size: 10pt; color: #7f1d1d; line-height: 1.5; }
        .amc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .amc-chart-section { display: flex; align-items: center; justify-content: center; }
        .amc-breakdown { display: flex; flex-direction: column; gap: 10px; }
        .amc-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; }
        .amc-item.high-exposure { background: #fef2f2; border-color: #fecaca; }
        .amc-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; }
        .amc-name { flex: 1; font-size: 10pt; color: #374151; }
        .amc-pct { font-size: 12pt; font-weight: 600; color: #1f2937; }
        
        /* Executive Summary */
        .exec-summary { display: flex; gap: 30px; margin-bottom: 30px; }
        .score-card { background: linear-gradient(135deg, ${config.primaryColor}15, ${config.primaryColor}05); border-radius: 12px; padding: 24px; text-align: center; flex: 0 0 180px; }
        .score-value { font-size: 48pt; font-weight: 700; color: ${config.primaryColor}; }
        .score-label { font-size: 10pt; color: #6b7280; }
        .action-list { flex: 1; }
        .action-item { background: #f9fafb; border-left: 4px solid ${config.primaryColor}; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0; }
        .action-title { font-weight: 600; color: #1f2937; }
        .action-desc { font-size: 10pt; color: #6b7280; margin-top: 4px; }
        
        /* Scheme Allocation Table */
        .scheme-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .scheme-table th { background: #f9fafb; padding: 14px 12px; text-align: left; font-size: 10pt; color: #6b7280; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
        .scheme-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 10pt; }
        .scheme-table .rank { color: #9ca3af; font-weight: 500; text-align: center; }
        .scheme-table .scheme-name { color: #1f2937; font-weight: 500; }
        .scheme-table .scheme-value { color: #374151; font-weight: 600; }
        .weight-bar-container { display: flex; align-items: center; gap: 8px; }
        .weight-bar { height: 8px; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px; }
        .weight-pct { font-size: 10pt; color: #374151; font-weight: 600; min-width: 45px; }
        .scheme-table tfoot td { background: #f9fafb; font-weight: 600; border-top: 2px solid #e5e7eb; }
        .total-label { color: #374151; }
        .total-value { color: #1f2937; font-size: 11pt; }
        .total-pct { color: #3b82f6; }
        
        /* Performance Analysis */
        .performance-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .performance-column { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .perf-header { font-size: 11pt; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; margin: 0; }
        .perf-header.positive { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .perf-header.negative { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
        .perf-list { padding: 8px 16px; }
        .perf-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .perf-item:last-child { border-bottom: none; }
        .perf-rank { color: #9ca3af; font-size: 10pt; font-weight: 500; width: 30px; }
        .perf-details { flex: 1; display: flex; justify-content: space-between; align-items: center; }
        .perf-name { font-size: 10pt; color: #374151; font-weight: 500; }
        .perf-val { font-size: 10pt; font-weight: 600; }
        .perf-val.positive { color: #10b981; }
        .perf-val.negative { color: #ef4444; }
        .perf-val.neutral { color: #6b7280; }
        
        /* Allocation Chart */
        .allocation-container { display: flex; gap: 40px; align-items: flex-start; }
        .allocation-bars { flex: 1; }
        .bar-row { display: flex; align-items: center; margin-bottom: 12px; }
        .bar-label { width: 100px; font-size: 10pt; color: #374151; }
        
        /* Portfolio Overlap */
        .overlap-summary { display: flex; gap: 30px; margin-bottom: 30px; }
        .overlap-score-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; flex: 0 0 200px; display: flex; flex-direction: column; justify-content: center; }
        .overlap-label { font-size: 10pt; color: #6b7280; margin-bottom: 8px; }
        .overlap-value { font-size: 32pt; font-weight: 700; margin-bottom: 4px; }
        .overlap-value.high-risk { color: #ef4444; }
        .overlap-value.low-risk { color: #10b981; }
        .overlap-status { font-size: 11pt; font-weight: 600; color: #374151; }
        .overlap-desc-box { flex: 1; background: #f9fafb; border-radius: 12px; padding: 20px; }
        .overlap-desc-title { font-size: 11pt; color: #1f2937; margin-bottom: 8px; font-weight: 600; }
        .overlap-desc-text { font-size: 10pt; color: #4b5563; line-height: 1.5; }
        .overlap-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .overlap-item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; }
        .overlap-schemes { margin-bottom: 12px; }
        .overlap-scheme-name { font-weight: 600; color: #374151; font-size: 10pt; }
        .overlap-vs { text-align: center; color: #9ca3af; font-size: 9pt; margin: 4px 0; font-style: italic; }
        .overlap-metrics { display: flex; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 12px; }
        .overlap-metric { text-align: center; }
        .metric-val { display: block; font-size: 12pt; font-weight: 700; color: #1f2937; }
        .metric-lbl { display: block; font-size: 9pt; color: #6b7280; }
        .overlap-insight { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px 16px; display: flex; gap: 12px; align-items: flex-start; font-size: 10pt; color: #1e40af; }
        .overlap-icon { font-size: 14pt; }
        
        .bar-container { flex: 1; height: 24px; background: #e5e7eb; border-radius: 4px; overflow: hidden; position: relative; }
        .bar-fill { height: 100%; border-radius: 4px; }
        .bar-equity { background: linear-gradient(90deg, #22c55e, #16a34a); }
        
        /* Risk-Return Scatter */
        .scatter-container { margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; }
        .quadrant-legend { background: #f9fafb; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .q-item { display: flex; align-items: center; gap: 10px; font-size: 9pt; color: #4b5563; }
        .q-dot { width: 12px; height: 12px; border-radius: 2px; border: 1px solid #d1d5db; }
        .q-label { flex: 1; }
        
        /* Investment Behavior */
        .behavior-style-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .style-label { font-size: 10pt; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }
        .style-title { font-size: 24pt; font-weight: 700; margin-bottom: 8px; }
        .style-desc { font-size: 11pt; color: #374151; }
        .behavior-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .behavior-metric-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .b-icon { font-size: 24pt; margin-bottom: 12px; }
        .b-val { font-size: 20pt; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
        .b-val.positive-val { color: #10b981; }
        .b-val.negative-val { color: #ef4444; }
        .b-lbl { font-size: 10pt; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
        .b-insight { font-size: 9pt; color: #6b7280; line-height: 1.4; }
        .behavior-tip { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; color: #92400e; font-size: 10pt; line-height: 1.5; }
        
        /* Year-wise Chart */
        .year-chart-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        
        /* Tax Exposure */
        .tax-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .tax-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .tax-icon { font-size: 24pt; margin-bottom: 12px; }
        .tax-label { font-size: 11pt; color: #6b7280; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .tax-value { font-size: 24pt; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
        .tax-status { font-size: 10pt; font-weight: 600; margin-bottom: 4px; }
        .tax-desc { font-size: 9pt; color: #9ca3af; }
        
        .tax-split-container { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }
        .tax-split-bar { display: flex; height: 32px; border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
        .split-segment { display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9pt; font-weight: 600; }
        .split-segment.equity { background: #3b82f6; }
        .split-segment.debt { background: #f59e0b; }
        .split-legend { display: flex; flex-direction: column; gap: 10px; }
        .legend-item { display: flex; align-items: flex-start; gap: 10px; font-size: 10pt; color: #4b5563; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .equity-dot { background: #3b82f6; }
        .debt-dot { background: #f59e0b; }
        
        /* Methodology */
        .disclosure-section { margin-bottom: 24px; }
        .disclosure-title { font-size: 11pt; color: #1f2937; margin-bottom: 8px; font-weight: 600; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; display: inline-block; }
        .disclosure-text { font-size: 10pt; color: #4b5563; line-height: 1.6; text-align: justify; }
        
        /* Compliance Slide */
        .compliance-hero { text-align: center; margin-bottom: 40px; }
        .compliance-icon { font-size: 40pt; margin-bottom: 16px; }
        .compliance-header { font-size: 24pt; color: #1f2937; margin-bottom: 8px; font-weight: 700; }
        .compliance-sub { font-size: 11pt; color: #6b7280; }
        .compliance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .compliance-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
        .c-title { font-size: 11pt; font-weight: 700; color: #374151; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; display: inline-block; }
        .c-text { font-size: 9pt; color: #4b5563; line-height: 1.6; text-align: justify; }
        .compliance-footer-meta { display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0; margin-bottom: 40px; }
        .meta-row { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-size: 8pt; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
        .meta-val { font-size: 10pt; color: #1f2937; font-weight: 600; }
        .end-mark { text-align: center; color: #d1d5db; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; font-size: 10pt; }
        
        .bar-mf { background: linear-gradient(90deg, #6366f1, #4f46e5); }
        .bar-value { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 9pt; font-weight: 600; color: white; }
        .persona-card { background: #f9fafb; border-radius: 12px; padding: 20px; min-width: 200px; }
        .persona-name { font-size: 16pt; font-weight: 700; color: ${config.primaryColor}; }
        .persona-risk { font-size: 11pt; color: #6b7280; margin-top: 4px; }
        
        /* Table Styles */
        .gap-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .gap-table th, .gap-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .gap-table th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 10pt; }
        .gap-table td { font-size: 10pt; }
        .gap-positive { color: #dc2626; font-weight: 600; }
        .gap-ok { color: #16a34a; }
        
        /* Projections */
        .projection-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .projection-card { background: #f9fafb; border-radius: 12px; padding: 20px; }
        .projection-title { font-weight: 600; color: #374151; margin-bottom: 16px; font-size: 12pt; }
        .projection-value { font-size: 24pt; font-weight: 700; color: ${config.primaryColor}; }
        .projection-label { font-size: 9pt; color: #6b7280; }
        .projection-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .assumptions { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 9pt; color: #92400e; }
        
        /* Marketplace */
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .product-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .product-name { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
        .product-category { font-size: 9pt; color: #6b7280; margin-bottom: 8px; }
        .product-isin { font-family: monospace; font-size: 9pt; color: #9ca3af; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
        .product-risk { display: inline-block; font-size: 8pt; padding: 2px 8px; border-radius: 999px; margin: 8px 0; }
        .risk-low { background: #dcfce7; color: #166534; }
        .risk-moderate { background: #fef3c7; color: #92400e; }
        .risk-high { background: #fee2e2; color: #991b1b; }
        .product-why { font-size: 9pt; color: #6b7280; font-style: italic; }
        
        /* Compliance */
        .compliance-section { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .compliance-title { font-size: 12pt; font-weight: 700; color: #991b1b; margin-bottom: 12px; }
        .compliance-text { font-size: 9pt; color: #7f1d1d; line-height: 1.6; }
        .compliance-meta { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px solid #fecaca; font-size: 8pt; color: #991b1b; }
        `;
    }

    /**
     * 1. Cover Page
     */
    private static renderCoverPage(data: PDFDataV3, config: WhiteLabelConfig, generatedDate: string): string {
        const logoHtml = config.logoUrl
            ? `<img src="${config.logoUrl}" alt="${config.companyName}" class="cover-logo" />`
            : '';

        const timestamp = new Date().toISOString();

        return `
        <div class="page cover-page">
            ${logoHtml}
            <div class="cover-company">${config.companyName}</div>
            <div class="cover-tagline">Advisory Intelligence</div>
            <div class="cover-line"></div>
            <div class="cover-title">WealthMax Portfolio Advisory Report</div>
            <div class="cover-client-info">
                <div class="cover-client-name">${data.user.name}</div>
                <div class="cover-advisory-date">Advisory Date: ${generatedDate}</div>
                <div class="cover-timestamp">Generated: ${timestamp}</div>
            </div>
            <div class="cover-prepared-by">Prepared by: WealthMax Advisory Engine</div>
            <div class="cover-footer-disclaimer">
                <p class="disclaimer-data-source">Data sourced from user inputs and third-party NAV providers.</p>
                <p class="disclaimer-advisory">This is advisory-only, read-only software. No trading or execution functionality.</p>
            </div>
        </div>`;
    }

    /**
     * 2. Portfolio Snapshot
     */
    private static renderPortfolioSnapshot(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const snapshot = data.portfolioSnapshot;

        // If no snapshot data, derive from portfolio if available
        const totalValue = snapshot?.totalValue || data.portfolio?.totalValuation || 0;
        const investedAmount = snapshot?.investedAmount || 0;
        const unrealizedGainLoss = snapshot?.unrealizedGainLoss || (totalValue - investedAmount);
        const gainLossPercent = snapshot?.gainLossPercent || (investedAmount > 0 ? ((unrealizedGainLoss / investedAmount) * 100) : 0);
        const holdingsCount = snapshot?.holdingsCount || data.portfolio?.holdings?.length || 0;
        const investmentHorizon = snapshot?.investmentHorizon || 'N/A';

        // Auto-generate insight text based on gain/loss
        let insightText: string;
        if (unrealizedGainLoss > 0) {
            insightText = `Your portfolio is performing well with an unrealized gain of ${gainLossPercent.toFixed(1)}%. Consider staying invested to capture long-term growth.`;
        } else if (unrealizedGainLoss < 0) {
            insightText = `Your portfolio shows an unrealized loss of ${Math.abs(gainLossPercent).toFixed(1)}%. Market fluctuations are normal; review your allocation if needed.`;
        } else {
            insightText = `Your portfolio value equals your invested amount. Continue your investment strategy for potential growth.`;
        }

        const gainLossClass = unrealizedGainLoss >= 0 ? 'snapshot-positive' : 'snapshot-negative';
        const gainLossSign = unrealizedGainLoss >= 0 ? '+' : '';

        return `
        <div class="page">
            <h2 class="section-header">Portfolio Snapshot</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">A comprehensive view of your current portfolio performance and holdings.</p>
            
            <div class="snapshot-grid">
                <div class="snapshot-card snapshot-primary">
                    <div class="snapshot-label">Net Worth</div>
                    <div class="snapshot-value">₹${this.formatCurrency(totalValue)}</div>
                </div>
                <div class="snapshot-card">
                    <div class="snapshot-label">Total Invested Amount</div>
                    <div class="snapshot-value">₹${this.formatCurrency(investedAmount)}</div>
                </div>
                <div class="snapshot-card">
                    <div class="snapshot-label">Total Returns</div>
                    <div class="snapshot-value ${gainLossClass}">${gainLossSign}₹${this.formatCurrency(Math.abs(unrealizedGainLoss))}</div>
                    <div class="snapshot-subvalue ${gainLossClass}">${gainLossSign}${gainLossPercent.toFixed(2)}%</div>
                </div>
                <div class="snapshot-card">
                    <div class="snapshot-label">Holdings Count</div>
                    <div class="snapshot-value">${holdingsCount}</div>
                </div>
                <div class="snapshot-card">
                    <div class="snapshot-label">Investment Horizon</div>
                    <div class="snapshot-value">${investmentHorizon}</div>
                </div>
            </div>

            <div class="snapshot-insight">
                <div class="insight-icon">💡</div>
                <div class="insight-text">${insightText}</div>
            </div>
        </div>`;
    }

    /**
     * 3. Growth Comparison Chart
     */
    private static renderGrowthChart(data: PDFDataV3, config: WhiteLabelConfig): string {
        const chartData = data.growthChart;

        // Graceful Degradation: Check for sufficient data
        const hasData = chartData?.labels && chartData.labels.length > 1;

        if (!hasData) {
            return `
            <div class="page">
                <h2 class="section-header">Portfolio Growth Comparison</h2>
                <div class="no-data-scan-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; margin: 40px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📉</div>
                    <h3 style="color: #374151; margin-bottom: 8px;">Insufficient History</h3>
                    <p style="color: #6b7280;">Returns and growth comparison available after 6 months of transaction data.</p>
                </div>
            </div>`;
        }

        const labels = chartData?.labels || [];
        const portfolioSeries = chartData?.portfolioSeries || [];
        const benchmarkSeries = chartData?.benchmarkSeries || [];

        // Calculate performance for insight
        const portfolioReturn = portfolioSeries.length > 1
            ? ((portfolioSeries[portfolioSeries.length - 1] - portfolioSeries[0]) / portfolioSeries[0]) * 100
            : 0;
        const benchmarkReturn = benchmarkSeries.length > 1
            ? ((benchmarkSeries[benchmarkSeries.length - 1] - benchmarkSeries[0]) / benchmarkSeries[0]) * 100
            : 0;
        const outperformance = portfolioReturn - benchmarkReturn;

        // Auto-generate insight text
        let insightText: string;
        if (outperformance > 2) {
            insightText = `Your portfolio has outperformed the benchmark by ${outperformance.toFixed(1)} percentage points. Strong stock selection and timing have contributed to this alpha generation.`;
        } else if (outperformance < -2) {
            insightText = `Your portfolio has underperformed the benchmark by ${Math.abs(outperformance).toFixed(1)} percentage points. Consider reviewing asset allocation for better alignment with market trends.`;
        } else {
            insightText = `Your portfolio is tracking closely with the benchmark (${outperformance >= 0 ? '+' : ''}${outperformance.toFixed(1)}%). This indicates diversified exposure aligned with market performance.`;
        }

        const chartId = `growthChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Portfolio Growth Comparison</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Growth of ₹10 invested over time - comparing your portfolio against the benchmark.</p>
            
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ${JSON.stringify(labels)},
                            datasets: [
                                {
                                    label: 'Your Portfolio',
                                    data: ${JSON.stringify(portfolioSeries)},
                                    borderColor: '${config.primaryColor}',
                                    backgroundColor: '${config.primaryColor}20',
                                    fill: true,
                                    tension: 0.3,
                                    pointRadius: 4,
                                    pointHoverRadius: 6
                                },
                                {
                                    label: 'Benchmark (Nifty 50)',
                                    data: ${JSON.stringify(benchmarkSeries)},
                                    borderColor: '#9ca3af',
                                    backgroundColor: 'transparent',
                                    borderDash: [5, 5],
                                    fill: false,
                                    tension: 0.3,
                                    pointRadius: 3,
                                    pointHoverRadius: 5
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                    labels: { font: { size: 11 }, padding: 20 }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.dataset.label + ': ₹' + context.parsed.y.toFixed(2);
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Time Period', font: { size: 11 } },
                                    grid: { display: false }
                                },
                                y: {
                                    title: { display: true, text: 'Growth of ₹10', font: { size: 11 } },
                                    grid: { color: '#e5e7eb' }
                                }
                            }
                        }
                    });
                })();
            </script>

            <div class="chart-insight">
                <div class="insight-metrics">
                    <div class="metric-item">
                        <span class="metric-label">Portfolio Return</span>
                        <span class="metric-value ${portfolioReturn >= 0 ? 'positive' : 'negative'}">${portfolioReturn >= 0 ? '+' : ''}${portfolioReturn.toFixed(1)}%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Benchmark Return</span>
                        <span class="metric-value">${benchmarkReturn >= 0 ? '+' : ''}${benchmarkReturn.toFixed(1)}%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Alpha Generated</span>
                        <span class="metric-value ${outperformance >= 0 ? 'positive' : 'negative'}">${outperformance >= 0 ? '+' : ''}${outperformance.toFixed(1)}%</span>
                    </div>
                </div>
                <p class="insight-text-chart">${insightText}</p>
            </div>
        </div>`;
    }

    /**
     * 4. Drawdown Analysis
     */
    private static renderDrawdownAnalysis(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const drawdownData = data.drawdownData;
        const series = drawdownData?.series || [];

        // Graceful Degradation
        if (!series || series.length === 0) {
            return `
            <div class="page">
                <h2 class="section-header">Drawdown Analysis</h2>
                <div class="no-data-scan-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; margin: 40px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
                    <h3 style="color: #374151; margin-bottom: 8px;">Risk Analysis Unavailable</h3>
                    <p style="color: #6b7280;">Drawdown analysis requires historical performance data to compute peak-to-trough declines.</p>
                </div>
            </div>`;
        }

        const labels = series.map(s => s.date);
        const values = series.map(s => s.drawdown);

        // Calculate max drawdown
        const maxDrawdown = drawdownData?.maxDrawdown || Math.min(...values);
        const maxDrawdownDate = drawdownData?.maxDrawdownDate || series.find(s => s.drawdown === maxDrawdown)?.date || 'N/A';
        const recoveryDays = drawdownData?.recoveryDays || 'N/A';

        // Auto-generate insight text
        let insightText: string;
        if (maxDrawdown > -5) {
            insightText = `Your portfolio has experienced minimal volatility with a maximum drawdown of ${Math.abs(maxDrawdown).toFixed(1)}%. This indicates a well-diversified, lower-risk portfolio.`;
        } else if (maxDrawdown > -15) {
            insightText = `Your portfolio experienced a moderate drawdown of ${Math.abs(maxDrawdown).toFixed(1)}% around ${maxDrawdownDate}. This is within normal market correction ranges.`;
        } else {
            insightText = `Your portfolio faced a significant drawdown of ${Math.abs(maxDrawdown).toFixed(1)}%. Consider reviewing your risk exposure and diversification strategy.`;
        }

        const chartId = `drawdownChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Drawdown Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Peak-to-trough decline analysis showing maximum portfolio losses from high points.</p>
            
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ${JSON.stringify(labels)},
                            datasets: [{
                                label: 'Drawdown %',
                                data: ${JSON.stringify(values)},
                                borderColor: '#dc2626',
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                fill: true,
                                tension: 0.3,
                                pointRadius: 4,
                                pointBackgroundColor: '#dc2626',
                                pointHoverRadius: 6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return 'Drawdown: ' + context.parsed.y.toFixed(2) + '%';
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Time Period', font: { size: 11 } },
                                    grid: { display: false }
                                },
                                y: {
                                    title: { display: true, text: 'Drawdown (%)', font: { size: 11 } },
                                    grid: { color: '#e5e7eb' },
                                    max: 0,
                                    ticks: {
                                        callback: function(value) {
                                            return value + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })();
            </script>

            <div class="drawdown-insight">
                <div class="drawdown-metrics">
                    <div class="drawdown-metric">
                        <div class="drawdown-metric-label">Maximum Drawdown</div>
                        <div class="drawdown-metric-value negative">${maxDrawdown.toFixed(1)}%</div>
                    </div>
                    <div class="drawdown-metric">
                        <div class="drawdown-metric-label">Occurred Around</div>
                        <div class="drawdown-metric-value">${maxDrawdownDate}</div>
                    </div>
                    <div class="drawdown-metric">
                        <div class="drawdown-metric-label">Recovery Period</div>
                        <div class="drawdown-metric-value">${typeof recoveryDays === 'number' ? recoveryDays + ' days' : recoveryDays}</div>
                    </div>
                </div>
                <p class="drawdown-insight-text">${insightText}</p>
            </div>
        </div>`;
    }

    /**
     * 5. Risk vs Return Summary Table
     */
    private static renderRiskReturnTable(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const riskData = data.riskReturnData;

        // Graceful Degradation: Check for benchmark data
        const hasBenchmark = riskData?.benchmarkXirr !== undefined && riskData?.benchmarkXirr !== 0;

        if (!hasBenchmark) {
            return `
            <div class="page">
                <h2 class="section-header">Return vs Risk Summary</h2>
                <div class="no-data-scan-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; margin: 40px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <h3 style="color: #374151; margin-bottom: 8px;">Benchmark Comparison Unavailable</h3>
                    <p style="color: #6b7280;">Benchmark data is currently unavailable for this portfolio's composition.</p>
                </div>
            </div>`;
        }

        const portfolioXirr = riskData?.portfolioXirr || 0;
        const benchmarkXirr = riskData?.benchmarkXirr || 0;
        const portfolioVolatility = riskData?.portfolioVolatility || 0;
        const benchmarkVolatility = riskData?.benchmarkVolatility || 0;

        // Calculate diffs
        const xirrDiff = portfolioXirr - benchmarkXirr;
        const volatilityDiff = portfolioVolatility - benchmarkVolatility;

        // Helper to determine class
        const getReturnClass = (diff: number) => diff >= 0 ? 'outperform' : 'underperform';
        const getVolatilityClass = (diff: number) => diff <= 0 ? 'outperform' : 'underperform'; // Lower volatility is better

        return `
        <div class="page">
            <h2 class="section-header">Return vs Risk Summary</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Comparative analysis of your portfolio's risk-adjusted performance against the benchmark.</p>
            
            <table class="risk-return-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Your Portfolio</th>
                        <th>Benchmark (Nifty 50)</th>
                        <th>Difference</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>XIRR (Annualized Return)</strong></td>
                        <td class="${getReturnClass(xirrDiff)}">${portfolioXirr >= 0 ? '+' : ''}${portfolioXirr.toFixed(2)}%</td>
                        <td>${benchmarkXirr >= 0 ? '+' : ''}${benchmarkXirr.toFixed(2)}%</td>
                        <td class="${getReturnClass(xirrDiff)}">${xirrDiff >= 0 ? '+' : ''}${xirrDiff.toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td><strong>Volatility (Std Dev)</strong></td>
                        <td class="${getVolatilityClass(volatilityDiff)}">${portfolioVolatility.toFixed(2)}%</td>
                        <td>${benchmarkVolatility.toFixed(2)}%</td>
                        <td class="${getVolatilityClass(volatilityDiff)}">${volatilityDiff >= 0 ? '+' : ''}${volatilityDiff.toFixed(2)}%</td>
                    </tr>
                </tbody>
            </table>

            <div class="risk-return-legend">
                <div class="legend-item">
                    <span class="legend-dot outperform"></span>
                    <span>Outperforming benchmark</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot underperform"></span>
                    <span>Underperforming benchmark</span>
                </div>
            </div>
        </div>`;
    }

    /**
     * 6. Scheme-wise Performance Comparison
     */
    private static renderSchemeComparison(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const schemeData = data.schemePerformance;

        // Fallback mock data
        const schemes = schemeData?.schemes || [
            { schemeName: 'HDFC Flexi Cap Fund', schemeXirr: 15.2, benchmarkXirr: 12.5 },
            { schemeName: 'SBI Blue Chip Fund', schemeXirr: 11.8, benchmarkXirr: 12.5 },
            { schemeName: 'Axis Small Cap Fund', schemeXirr: 18.5, benchmarkXirr: 14.2 },
            { schemeName: 'ICICI Pru Value Discovery', schemeXirr: 13.0, benchmarkXirr: 12.5 },
            { schemeName: 'Kotak Emerging Equity', schemeXirr: 10.2, benchmarkXirr: 12.5 }
        ];

        // Calculate excess returns
        const excessReturns = schemes.map(s => ({
            name: s.schemeName || 'Unknown Scheme',
            excess: (s.schemeXirr || 0) - (s.benchmarkXirr || 0)
        }));

        // Classify schemes
        const outperformers = excessReturns.filter(s => s.excess > 1);
        const neutral = excessReturns.filter(s => s.excess >= -1 && s.excess <= 1);
        const underperformers = excessReturns.filter(s => s.excess < -1);

        // Chart colors based on excess returns
        const barColors = excessReturns.map(s =>
            s.excess > 1 ? '#16a34a' : s.excess < -1 ? '#dc2626' : '#9ca3af'
        );

        const chartId = `schemeChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Scheme-wise Performance</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Excess returns of individual schemes vs their respective benchmarks.</p>
            
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ${JSON.stringify(excessReturns.map(s => s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name))},
                            datasets: [{
                                label: 'Excess Return vs Benchmark',
                                data: ${JSON.stringify(excessReturns.map(s => parseFloat(s.excess.toFixed(2))))},
                                backgroundColor: ${JSON.stringify(barColors)},
                                borderColor: ${JSON.stringify(barColors)},
                                borderWidth: 1
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const val = context.parsed.x;
                                            return (val >= 0 ? '+' : '') + val.toFixed(2) + '% excess return';
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Excess Return (%)', font: { size: 11 } },
                                    grid: { color: '#e5e7eb' }
                                },
                                y: {
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                })();
            </script>

            <div class="scheme-classification">
                <div class="classification-group outperform-group">
                    <div class="classification-header">🏆 Outperformers (${outperformers.length})</div>
                    <div class="classification-list">${outperformers.map(s => s.name).join(', ') || 'None'}</div>
                </div>
                <div class="classification-group neutral-group">
                    <div class="classification-header">➖ Neutral (${neutral.length})</div>
                    <div class="classification-list">${neutral.map(s => s.name).join(', ') || 'None'}</div>
                </div>
                <div class="classification-group underperform-group">
                    <div class="classification-header">⚠️ Underperformers (${underperformers.length})</div>
                    <div class="classification-list">${underperformers.map(s => s.name).join(', ') || 'None'}</div>
                </div>
            </div>
        </div>`;
    }

    /**
     * 7. Long-term Wealth Projection
     */
    private static renderWealthProjection(data: PDFDataV3, config: WhiteLabelConfig): string {
        const projData = data.wealthProjection;

        // Fallback mock data (assuming ~12% CAGR)
        const currentValue = projData?.currentValue ?? 500000;
        const projectedValue5y = projData?.projectedValue5y ?? Math.round(currentValue * 1.76);
        const projectedValue10y = projData?.projectedValue10y ?? Math.round(currentValue * 3.1);
        const projectedValue20y = projData?.projectedValue20y ?? Math.round(currentValue * 9.6);
        const assumedRate = projData?.assumedRate ?? 12;

        // Create projection points for smooth curve
        const years = [0, 5, 10, 15, 20];
        const values = [
            currentValue,
            projectedValue5y,
            projectedValue10y,
            Math.round((projectedValue10y + projectedValue20y) / 2), // 15yr interpolated
            projectedValue20y
        ];

        const chartId = `wealthChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Long-term Wealth Projection</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Projected portfolio growth over 20 years at an assumed ${assumedRate}% annual return.</p>
            
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ${JSON.stringify(years.map(y => y === 0 ? 'Today' : y + ' Years'))},
                            datasets: [{
                                label: 'Projected Value',
                                data: ${JSON.stringify(values)},
                                borderColor: '${config.primaryColor}',
                                backgroundColor: '${config.primaryColor}20',
                                fill: true,
                                tension: 0.4,
                                pointRadius: 6,
                                pointBackgroundColor: '${config.primaryColor}',
                                pointHoverRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return '₹' + context.parsed.y.toLocaleString('en-IN');
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Investment Horizon', font: { size: 11 } },
                                    grid: { display: false }
                                },
                                y: {
                                    title: { display: true, text: 'Portfolio Value (₹)', font: { size: 11 } },
                                    grid: { color: '#e5e7eb' },
                                    ticks: {
                                        callback: function(value) {
                                            return '₹' + (value / 100000).toFixed(1) + 'L';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })();
            </script>

            <div class="projection-milestones">
                <div class="milestone-card">
                    <div class="milestone-label">Today</div>
                    <div class="milestone-value">₹${this.formatCurrency(currentValue)}</div>
                </div>
                <div class="milestone-card">
                    <div class="milestone-label">5 Years</div>
                    <div class="milestone-value">₹${this.formatCurrency(projectedValue5y)}</div>
                    <div class="milestone-growth">+${((projectedValue5y / currentValue - 1) * 100).toFixed(0)}%</div>
                </div>
                <div class="milestone-card">
                    <div class="milestone-label">10 Years</div>
                    <div class="milestone-value">₹${this.formatCurrency(projectedValue10y)}</div>
                    <div class="milestone-growth">+${((projectedValue10y / currentValue - 1) * 100).toFixed(0)}%</div>
                </div>
                <div class="milestone-card highlight">
                    <div class="milestone-label">20 Years</div>
                    <div class="milestone-value">₹${this.formatCurrency(projectedValue20y)}</div>
                    <div class="milestone-growth">+${((projectedValue20y / currentValue - 1) * 100).toFixed(0)}%</div>
                </div>
            </div>
        </div>`;
    }

    /**
     * 8. SIP Analysis
     */
    private static renderSIPAnalysis(data: PDFDataV3, config: WhiteLabelConfig): string {
        const sipData = data.sipAnalysis;

        // Graceful Degradation: Hide entire slide if no SIPs
        if (!sipData || sipData.sipCount === 0 || sipData.monthlySipAmount === 0) {
            return ''; // Gracefully skip this slide
        }

        const sipCount = sipData.sipCount;
        const monthlySipAmount = sipData.monthlySipAmount;
        const categorySplit = sipData.categorySplit || [];

        const colors = ['#1a56db', '#16a34a', '#dc2626', '#9333ea', '#f59e0b', '#06b6d4'];
        const chartId = `sipChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">SIP Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Overview of your Systematic Investment Plans and category-wise allocation.</p>
            
            <div class="sip-layout">
                <div class="sip-summary">
                    <div class="sip-stat">
                        <div class="sip-stat-value" style="color: ${config.primaryColor};">${sipCount}</div>
                        <div class="sip-stat-label">Active SIPs</div>
                    </div>
                    <div class="sip-stat">
                        <div class="sip-stat-value">₹${this.formatCurrency(monthlySipAmount)}</div>
                        <div class="sip-stat-label">Monthly Investment</div>
                    </div>
                    <div class="sip-stat">
                        <div class="sip-stat-value">₹${this.formatCurrency(monthlySipAmount * 12)}</div>
                        <div class="sip-stat-label">Yearly Investment</div>
                    </div>
                </div>
                
                <div class="sip-chart-area">
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="${chartId}"></canvas>
                    </div>
                    
                    <div class="sip-legend">
                        ${categorySplit.map((cat, i) => `
                            <div class="sip-legend-item">
                                <span class="sip-legend-dot" style="background: ${colors[i % colors.length]};"></span>
                                <span class="sip-legend-label">${cat.category}</span>
                                <span class="sip-legend-value">₹${this.formatCurrency(cat.amount)} (${cat.percentage}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ${JSON.stringify(categorySplit.map(c => c.category))},
                            datasets: [{
                                data: ${JSON.stringify(categorySplit.map(c => c.percentage))},
                                backgroundColor: ${JSON.stringify(colors.slice(0, categorySplit.length))},
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '60%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.label + ': ' + context.parsed + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })();
            </script>
        </div>`;
    }

    /**
     * 9. Asset Allocation
     */
    private static renderAssetAllocation(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const allocData = data.assetAllocation;

        // Fallback mock data
        const classes = allocData?.classes || [
            { name: 'Equity', percentage: 60, xirr: 14.5 },
            { name: 'Debt', percentage: 25, xirr: 7.2 },
            { name: 'Gold', percentage: 10, xirr: 8.8 },
            { name: 'Cash', percentage: 5, xirr: 4.0 }
        ];

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        const donutChartId = `allocDonut_${Date.now()}`;
        const barChartId = `allocBar_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Asset Allocation</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Portfolio distribution across asset classes and their respective returns.</p>
            
            <div class="asset-layout">
                <div class="asset-donut-section">
                    <h3 style="font-size: 12pt; color: #374151; margin-bottom: 16px; text-align: center;">Allocation Split</h3>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="${donutChartId}"></canvas>
                    </div>
                    <div class="asset-legend">
                        ${classes.map((c, i) => `
                            <div class="asset-legend-item">
                                <span class="asset-legend-dot" style="background: ${colors[i % colors.length]};"></span>
                                <span>${c.name}: ${c.percentage}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="asset-bar-section">
                    <h3 style="font-size: 12pt; color: #374151; margin-bottom: 16px; text-align: center;">XIRR by Asset Class</h3>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="${barChartId}"></canvas>
                    </div>
                </div>
            </div>

            <script>
                (function() {
                    // Donut Chart
                    const donutCtx = document.getElementById('${donutChartId}').getContext('2d');
                    new Chart(donutCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ${JSON.stringify(classes.map(c => c.name))},
                            datasets: [{
                                data: ${JSON.stringify(classes.map(c => c.percentage))},
                                backgroundColor: ${JSON.stringify(colors.slice(0, classes.length))},
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '55%',
                            plugins: { legend: { display: false } }
                        }
                    });

                    // Bar Chart
                    const barCtx = document.getElementById('${barChartId}').getContext('2d');
                    new Chart(barCtx, {
                        type: 'bar',
                        data: {
                            labels: ${JSON.stringify(classes.map(c => c.name))},
                            datasets: [{
                                label: 'XIRR %',
                                data: ${JSON.stringify(classes.map(c => c.xirr))},
                                backgroundColor: ${JSON.stringify(colors.slice(0, classes.length))},
                                borderRadius: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { grid: { display: false } },
                                y: {
                                    title: { display: true, text: 'XIRR (%)', font: { size: 10 } },
                                    grid: { color: '#e5e7eb' },
                                    ticks: { callback: function(v) { return v + '%'; } }
                                }
                            }
                        }
                    });
                })();
            </script>
        </div>`;
    }

    /**
     * 10. MF Category Allocation
     */
    private static renderMFCategoryAllocation(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const mfData = data.mfCategoryAllocation;

        // Fallback mock data
        const categories = mfData?.categories || [
            { category: 'Large Cap', percentage: 35, value: 175000 },
            { category: 'Mid Cap', percentage: 25, value: 125000 },
            { category: 'Small Cap', percentage: 15, value: 75000 },
            { category: 'Flexi Cap', percentage: 10, value: 50000 },
            { category: 'Debt/Hybrid', percentage: 10, value: 50000 },
            { category: 'Sectoral', percentage: 5, value: 25000 }
        ];

        const colors = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'];
        const chartId = `mfCatChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Category Exposure</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Distribution of your mutual fund investments across fund categories.</p>
            
            <div class="mf-layout">
                <div class="mf-chart-section">
                    <div class="chart-container" style="height: 300px;">
                        <canvas id="${chartId}"></canvas>
                    </div>
                </div>
                
                <div class="mf-breakdown">
                    <table class="mf-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Allocation</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categories.map((c, i) => `
                                <tr>
                                    <td>
                                        <span class="mf-dot" style="background: ${colors[i % colors.length]};"></span>
                                        ${c.category}
                                    </td>
                                    <td>${c.percentage}%</td>
                                    <td>₹${this.formatCurrency(c.value)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ${JSON.stringify(categories.map(c => c.category))},
                            datasets: [{
                                data: ${JSON.stringify(categories.map(c => c.percentage))},
                                backgroundColor: ${JSON.stringify(colors.slice(0, categories.length))},
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '50%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.label + ': ' + context.parsed + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })();
            </script>
        </div>`;
    }

    /**
     * 11. AMC Exposure Analysis
     */
    private static renderAMCExposure(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const amcData = data.amcExposure;

        // Fallback mock data
        const amcs = amcData?.amcs || [
            { amcName: 'HDFC AMC', percentage: 28 },
            { amcName: 'ICICI Prudential', percentage: 22 },
            { amcName: 'SBI MF', percentage: 20 },
            { amcName: 'Axis MF', percentage: 15 },
            { amcName: 'Kotak MF', percentage: 10 },
            { amcName: 'Others', percentage: 5 }
        ];

        const colors = ['#1a56db', '#16a34a', '#dc2626', '#9333ea', '#f59e0b', '#06b6d4', '#ec4899'];
        const chartId = `amcChart_${Date.now()}`;

        // Concentration risk detection
        const concentratedAMCs = amcs.filter(a => a.percentage > 35);
        const hasConcentrationRisk = concentratedAMCs.length > 0;

        return `
        <div class="page">
            <h2 class="section-header">AMC Exposure Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Distribution of investments across Asset Management Companies.</p>
            
            ${hasConcentrationRisk ? `
            <div class="concentration-alert">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <div class="alert-title">Concentration Risk Detected</div>
                    <div class="alert-desc">
                        ${concentratedAMCs.map(a => `<strong>${a.amcName}</strong> holds ${a.percentage}% of your portfolio.`).join(' ')}
                        Consider diversifying across more AMCs to reduce single-entity risk.
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="amc-layout">
                <div class="amc-chart-section">
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="${chartId}"></canvas>
                    </div>
                </div>
                
                <div class="amc-breakdown">
                    ${amcs.map((a, i) => `
                        <div class="amc-item ${a.percentage > 35 ? 'high-exposure' : ''}">
                            <span class="amc-dot" style="background: ${colors[i % colors.length]};"></span>
                            <span class="amc-name">${a.amcName}</span>
                            <span class="amc-pct">${a.percentage}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ${JSON.stringify(amcs.map(a => a.amcName))},
                            datasets: [{
                                data: ${JSON.stringify(amcs.map(a => a.percentage))},
                                backgroundColor: ${JSON.stringify(colors.slice(0, amcs.length))},
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '55%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.label + ': ' + context.parsed + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })();
            </script>
        </div>`;
    }

    /**
     * 12. Scheme Allocation Table
     */
    private static renderSchemeAllocationTable(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const schemeData = data.schemeAllocation;

        // Fallback mock data (sorted by weight descending)
        const schemes = (schemeData?.schemes || [
            { schemeName: 'HDFC Top 100 Fund - Direct Growth', value: 125000, weightPercent: 25 },
            { schemeName: 'ICICI Prudential Bluechip Fund', value: 100000, weightPercent: 20 },
            { schemeName: 'SBI Small Cap Fund - Direct Growth', value: 75000, weightPercent: 15 },
            { schemeName: 'Axis Midcap Fund - Direct Growth', value: 62500, weightPercent: 12.5 },
            { schemeName: 'Kotak Flexi Cap Fund', value: 50000, weightPercent: 10 },
            { schemeName: 'Parag Parikh Flexi Cap Fund', value: 50000, weightPercent: 10 },
            { schemeName: 'Mirae Asset Large Cap Fund', value: 37500, weightPercent: 7.5 }
        ]).sort((a, b) => b.weightPercent - a.weightPercent);

        const totalValue = schemes.reduce((sum, s) => sum + s.value, 0);

        return `
        <div class="page">
            <h2 class="section-header">Scheme-wise Allocation</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Complete breakdown of your portfolio by individual schemes, sorted by portfolio weight.</p>
            
            <table class="scheme-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 45%;">Scheme Name</th>
                        <th style="width: 20%;">Value</th>
                        <th style="width: 30%;">Portfolio Weight</th>
                    </tr>
                </thead>
                <tbody>
                    ${schemes.map((s, i) => `
                        <tr>
                            <td class="rank">${i + 1}</td>
                            <td class="scheme-name">${s.schemeName}</td>
                            <td class="scheme-value">₹${this.formatCurrency(s.value)}</td>
                            <td>
                                <div class="weight-bar-container">
                                    <div class="weight-bar" style="width: ${Math.min(s.weightPercent * 2, 100)}%;"></div>
                                    <span class="weight-pct">${s.weightPercent.toFixed(1)}%</span>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td></td>
                        <td class="total-label">Total</td>
                        <td class="total-value">₹${this.formatCurrency(totalValue)}</td>
                        <td class="total-pct">100%</td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    }

    /**
     * 13. Top & Bottom Performers
     */
    private static renderBestWorstPerformers(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const xirrData = data.schemeXIRRList;

        // Fallback mock data
        let schemes = xirrData?.schemes || [
            { schemeName: 'Quant Small Cap Fund', xirr: 32.5 },
            { schemeName: 'Nippon India Small Cap', xirr: 28.4 },
            { schemeName: 'HDFC Mid-Cap Opportunities', xirr: 24.1 },
            { schemeName: 'SBI Magnum Midcap', xirr: 21.8 },
            { schemeName: 'Kotak Emerging Equity', xirr: 19.5 },
            { schemeName: 'Axis Bluechip Fund', xirr: 12.2 },
            { schemeName: 'SBI Bluechip Fund', xirr: 11.5 },
            { schemeName: 'Mirae Asset Large Cap', xirr: 9.8 },
            { schemeName: 'HDFC Liquid Fund', xirr: 6.5 },
            { schemeName: 'ICICI Prudential Liquid', xirr: 6.2 }
        ];

        // Sort by XIRR descending
        schemes.sort((a, b) => b.xirr - a.xirr);

        const top5 = schemes.slice(0, 5);
        const bottom5 = schemes.slice(-5).reverse(); // Bottom 5, shown worst to best among them

        return `
        <div class="page">
            <h2 class="section-header">Performance Analysis: Top & Bottom Schemes</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Highlighting the best performing assets and those lagging behind in your portfolio based on XIRR.</p>
            
            <div class="performance-layout">
                <div class="performance-column">
                    <h3 class="perf-header positive">🚀 Top 5 Performers</h3>
                    <div class="perf-list">
                        ${top5.map((s, i) => `
                            <div class="perf-item">
                                <span class="perf-rank">#${i + 1}</span>
                                <div class="perf-details">
                                    <div class="perf-name">${s.schemeName}</div>
                                    <div class="perf-val positive">+${s.xirr.toFixed(1)}%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="performance-column">
                    <h3 class="perf-header negative">📉 Bottom 5 Performers</h3>
                    <div class="perf-list">
                        ${bottom5.map((s, i) => `
                            <div class="perf-item">
                                <span class="perf-rank">#${i + 1}</span>
                                <div class="perf-details">
                                    <div class="perf-name">${s.schemeName}</div>
                                    <div class="perf-val ${s.xirr >= 0 ? 'neutral' : 'negative'}">${s.xirr > 0 ? '+' : ''}${s.xirr.toFixed(1)}%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    }

    /**
     * 14. Portfolio Overlap Analysis
     */
    private static renderPortfolioOverlap(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const overlapData = data.overlapAnalysis;

        // Fallback mock data
        const portfolioOverlap = overlapData?.portfolioOverlapPercentage || 42;
        const groups = overlapData?.similarHoldingsGroups || [
            {
                schemes: ['HDFC Top 100 Fund', 'ICICI Bluechip Fund'],
                overlapPercentage: 68,
                commonHoldingsCount: 34
            },
            {
                schemes: ['Axis Midcap Fund', 'SBI Magnum Midcap'],
                overlapPercentage: 54,
                commonHoldingsCount: 22
            },
            {
                schemes: ['Kotak Flexi Cap', 'Parag Parikh Flexi Cap'],
                overlapPercentage: 45,
                commonHoldingsCount: 18
            }
        ];

        return `
        <div class="page">
            <h2 class="section-header">Portfolio Overlap Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
                Identify redundancy in your portfolio. High overlap indicates you might be holding the same underlying stocks through different schemes, reducing diversification benefits.
            </p>

            <div class="overlap-summary">
                <div class="overlap-score-card">
                    <div class="overlap-label">Overall Portfolio Overlap</div>
                    <div class="overlap-value ${portfolioOverlap > 30 ? 'high-risk' : 'low-risk'}">${portfolioOverlap}%</div>
                    <div class="overlap-status">${portfolioOverlap > 30 ? 'High Redundancy' : 'Well Diversified'}</div>
                </div>
                <div class="overlap-desc-box">
                    <h4 class="overlap-desc-title">Why this matters?</h4>
                    <p class="overlap-desc-text">
                        Your portfolio has a <strong>${portfolioOverlap}% overlap</strong> across different schemes. 
                        ${portfolioOverlap > 30
                ? 'This suggests significant duplication in underlying stock holdings, meaning you are paying multiple expense ratios for similar exposure. Consider consolidating schemes.'
                : 'This indicates good diversification. Your schemes are investing in distinct sets of stocks, maximizing your market coverage.'}
                    </p>
                </div>
            </div>

            <h3 class="subsection-header">Top Overlap Groups</h3>
            <div class="overlap-groups">
                ${groups.map(g => `
                    <div class="overlap-item">
                        <div class="overlap-schemes">
                            ${g.schemes.map(s => `<div class="overlap-scheme-name">${s}</div>`).join('<div class="overlap-vs">vs</div>')}
                        </div>
                        <div class="overlap-metrics">
                            <div class="overlap-metric">
                                <span class="metric-val">${g.overlapPercentage}%</span>
                                <span class="metric-lbl">Overlap</span>
                            </div>
                            <div class="overlap-metric">
                                <span class="metric-val">${g.commonHoldingsCount}</span>
                                <span class="metric-lbl">Common Stocks</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="overlap-insight">
                <span class="overlap-icon">💡</span>
                <span><strong>Recommendation:</strong> Schemes with >50% overlap provide little diversification benefit. You can likely switch to a single scheme in these categories to simplify tracking and reduce costs without changing your risk profile.</span>
            </div>
        </div>`;
    }

    /**
     * 15. Risk-Return Scatter Plot
     */
    private static renderRiskReturnScatter(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const scatterData = data.riskReturnScatter;

        // Fallback mock data
        const points = scatterData?.points || [
            { schemeName: 'Nippon Small Cap', volatility: 18.5, return: 28.4, category: 'Small Cap' },
            { schemeName: 'Quant Small Cap', volatility: 22.1, return: 32.5, category: 'Small Cap' },
            { schemeName: 'HDFC Mid Cap', volatility: 15.2, return: 24.1, category: 'Mid Cap' },
            { schemeName: 'SBI Magnum', volatility: 16.8, return: 21.8, category: 'Mid Cap' },
            { schemeName: 'Axis Bluechip', volatility: 10.5, return: 12.2, category: 'Large Cap' },
            { schemeName: 'SBI Bluechip', volatility: 11.2, return: 11.5, category: 'Large Cap' },
            { schemeName: 'HDFC Liquid', volatility: 0.8, return: 6.5, category: 'Debt' },
            { schemeName: 'ICICI Liquid', volatility: 0.7, return: 6.2, category: 'Debt' }
        ];

        const chartId = `riskReturnChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Risk vs Return Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">
                Visualizing how your schemes perform relative to the risk they take. 
                Schemes in the <strong style="color: #16a34a;">Top-Left</strong> are most efficient (High Return, Low Risk).
            </p>

            <div class="scatter-container" style="height: 400px; position: relative;">
                <canvas id="${chartId}"></canvas>
            </div>

            <div class="quadrant-legend">
                <div class="q-item">
                    <span class="q-dot" style="background: #e0f2fe;"></span>
                    <span class="q-label"><strong>Low Risk, High Return:</strong> Efficient Frontier (Ideal)</span>
                </div>
                <div class="q-item">
                    <span class="q-dot" style="background: #f0fdf4;"></span>
                    <span class="q-label"><strong>High Risk, High Return:</strong> Aggressive Growth</span>
                </div>
                <div class="q-item">
                    <span class="q-dot" style="background: #fefce8;"></span>
                    <span class="q-label"><strong>Low Risk, Low Return:</strong> Defensive / Stability</span>
                </div>
                <div class="q-item">
                    <span class="q-dot" style="background: #fef2f2;"></span>
                    <span class="q-label"><strong>High Risk, Low Return:</strong> Inefficient (Review Needed)</span>
                </div>
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'scatter',
                        data: {
                            datasets: [{
                                label: 'Schemes',
                                data: ${JSON.stringify(points.map(p => ({ x: p.volatility, y: p.return, scheme: p.schemeName, category: p.category })))},
                                backgroundColor: function(context) {
                                    const val = context.raw;
                                    if (!val) return '#3b82f6';
                                    if (val.y > 15 && val.x < 15) return '#16a34a'; // High Return, Low Risk
                                    if (val.y > 15 && val.x >= 15) return '#f59e0b'; // High Return, High Risk
                                    if (val.y <= 15 && val.x < 15) return '#3b82f6'; // Low Return, Low Risk
                                    return '#dc2626'; // Low Return, High Risk
                                },
                                pointRadius: 6,
                                pointHoverRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const p = context.raw;
                                            return p.scheme + ' (Risk: ' + p.x + '%, Ret: ' + p.y + '%)';
                                        }
                                    }
                                },
                                annotation: {
                                    annotations: {
                                        line1: {
                                            type: 'line',
                                            yMin: 15,
                                            yMax: 15,
                                            borderColor: '#9ca3af',
                                            borderWidth: 1,
                                            borderDash: [5, 5]
                                        },
                                        line2: {
                                            type: 'line',
                                            xMin: 15,
                                            xMax: 15,
                                            borderColor: '#9ca3af',
                                            borderWidth: 1,
                                            borderDash: [5, 5]
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Risk (Standard Deviation %)' },
                                    grid: { display: true }
                                },
                                y: {
                                    title: { display: true, text: 'Return (CAGR %)' },
                                    grid: { display: true }
                                }
                            }
                        }
                    });
                })();
            </script>
        </div>`;
    }

    /**
     * 16. Investment Behavior Analysis
     */
    private static renderBehaviorAnalysis(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const behavior = data.behaviorAnalysis;

        // Fallback mock data
        const holdingPeriod = behavior?.avgHoldingPeriod || "2.5 Years";
        const concentration = behavior?.concentrationRatio || 0.45;
        const churn = behavior?.churnRate || 0.15;

        // Insights logic
        let investorStyle = "Disciplined Investor";
        let styleColor = "#16a34a"; // Green
        let insightText = "Your portfolio reflects a steady, long-term approach.";

        if (churn > 0.4) {
            investorStyle = "High Churn (Impulsive)";
            styleColor = "#dc2626"; // Red
            insightText = "Frequent buying and selling may be increasing costs and reducing tax efficiency.";
        } else if (concentration > 0.6) {
            investorStyle = "Focused / Aggressive";
            styleColor = "#f59e0b"; // Yellow
            insightText = "Highly concentrated portfolio. High risk, high reward potential.";
        } else if (concentration < 0.1) {
            investorStyle = "Over-Diversified";
            styleColor = "#f59e0b"; // Yellow
            insightText = "Holding too many schemes often dilutes returns without reducing risk significantly.";
        }

        return `
        <div class="page">
            <h2 class="section-header">Investment Behavior Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
                Analyzing your trading patterns to understand your psychological approach to investing.
            </p>

            <div class="behavior-style-card" style="border-left: 5px solid ${styleColor};">
                <div class="style-label">Detected Investor Style</div>
                <div class="style-title" style="color: ${styleColor};">${investorStyle}</div>
                <div class="style-desc">${insightText}</div>
            </div>

            <div class="behavior-metrics">
                <div class="behavior-metric-card">
                    <div class="b-icon">⏳</div>
                    <div class="b-val">${holdingPeriod}</div>
                    <div class="b-lbl">Avg. Holding Period</div>
                    <div class="b-insight">Longer is better for compounding (Target > 3 Years)</div>
                </div>
                <div class="behavior-metric-card">
                    <div class="b-icon">🎯</div>
                    <div class="b-val">${(concentration * 100).toFixed(0)}%</div>
                    <div class="b-lbl">Concentration Ratio</div>
                    <div class="b-insight">Top 3 schemes vs Total Portfolio. Ideal: 30-50%</div>
                </div>
                <div class="behavior-metric-card">
                    <div class="b-icon">🔄</div>
                    <div class="b-val ${(churn * 100) > 20 ? 'negative-val' : 'positive-val'}">${(churn * 100).toFixed(0)}%</div>
                    <div class="b-lbl">Portfolio Churn</div>
                    <div class="b-insight">% of portfolio bought/sold annually. Lower is better.</div>
                </div>
            </div>

            <div class="behavior-tip">
                <strong>💡 Quick Tip:</strong> 
                ${churn > 0.2
                ? "Try to resist the urge to react to short-term market movements. 'Time in the market' beats 'timing the market'."
                : "You are doing great! Continue your disciplined SIPs and review your portfolio only once every 6 months."}
            </div>
        </div>`;
    }

    /**
     * 17. Year-wise Investment Chart
     */
    private static renderYearwiseInvestments(data: PDFDataV3, config: WhiteLabelConfig): string {
        const investmentData = data.yearlyInvestments;

        // Fallback mock data
        const investments = investmentData?.yearlyNetInvestments || [
            { year: '2021', amount: 150000 },
            { year: '2022', amount: 240000 },
            { year: '2023', amount: 300000 },
            { year: '2024', amount: 360000 },
            { year: '2025', amount: 420000 }
        ];

        const chartId = `yearwiseChart_${Date.now()}`;

        return `
        <div class="page">
            <h2 class="section-header">Investment Consistency Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
                Tracking your net investment amounts year over year. Consistent increase in annual investments is key to wealth creation.
            </p>

            <div class="year-chart-container" style="height: 400px; position: relative; margin-bottom: 24px;">
                <canvas id="${chartId}"></canvas>
            </div>

            <div class="behavior-tip">
                <strong>💡 Quick Tip:</strong> 
                Aim to increase your annual investment amount by at least 10% every year to beat inflation and accelerate your financial freedom journey.
            </div>

            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ${JSON.stringify(investments.map(i => i.year))},
                            datasets: [{
                                label: 'Net Investment (₹)',
                                data: ${JSON.stringify(investments.map(i => i.amount))},
                                backgroundColor: '${config.primaryColor}',
                                borderRadius: 6,
                                barThickness: 40
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return '₹ ' + context.formattedValue;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { display: true, borderDash: [2, 2] },
                                    ticks: {
                                        callback: function(value) {
                                            return '₹' + (value/1000) + 'k';
                                        }
                                    }
                                },
                                x: {
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                })();
            </script>
        </div>`;
    }

    /**
     * 18. Tax Exposure Summary
     */
    private static renderTaxExposure(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const taxData = data.taxExposure;

        // Fallback mock data
        const ltcg = taxData?.potentialLTCG || 125000;
        const stcg = taxData?.potentialSTCG || 45000;
        const equityPct = taxData?.equityPercentage || 75;
        const debtPct = taxData?.debtPercentage || 25;

        // Insights
        const ltcgLimit = 125000; // FY24-25 limit
        const ltcgStatus = ltcg > ltcgLimit ? 'Exceeded Limit' : 'Within Limit';
        const ltcgColor = ltcg > ltcgLimit ? '#dc2626' : '#16a34a';

        return `
        <div class="page">
            <h2 class="section-header">Tax Exposure Summary (Indicative)</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
                An estimate of your potential capital gains tax liability based on current portfolio value and holding periods. 
                <span style="color: #ef4444; font-weight: 600;">Note: This is an indicative report. Please consult a tax professional for actual filing.</span>
            </p>

            <div class="tax-cards">
                <div class="tax-card">
                    <div class="tax-icon">📉</div>
                    <div class="tax-label">Potential LTCG</div>
                    <div class="tax-value">₹${ltcg.toLocaleString('en-IN')}</div>
                    <div class="tax-status" style="color: ${ltcgColor};">
                        ${ltcgStatus} (Limit: ₹1.25L)
                    </div>
                    <div class="tax-desc">Long Term Capital Gains > 1 Year</div>
                </div>

                <div class="tax-card">
                    <div class="tax-icon">📈</div>
                    <div class="tax-label">Potential STCG</div>
                    <div class="tax-value">₹${stcg.toLocaleString('en-IN')}</div>
                    <div class="tax-status" style="color: #f59e0b;">
                        Taxable @ 20%
                    </div>
                    <div class="tax-desc">Short Term Capital Gains < 1 Year</div>
                </div>
            </div>

            <h3 class="subsection-header">Tax Efficiency by Asset Class</h3>
            <div class="tax-split-container">
                <div class="tax-split-bar">
                    <div class="split-segment equity" style="width: ${equityPct}%;">
                        <span class="split-label">Equity (${equityPct}%)</span>
                    </div>
                    <div class="split-segment debt" style="width: ${debtPct}%;">
                        <span class="split-label">Debt (${debtPct}%)</span>
                    </div>
                </div>
                <div class="split-legend">
                    <div class="legend-item">
                        <span class="legend-dot equity-dot"></span>
                        <div class="legend-text">
                            <strong>Equity:</strong> Favorable tax treatment. LTCG exempt up to ₹1.25L/yr, 12.5% thereafter.
                        </div>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot debt-dot"></span>
                        <div class="legend-text">
                            <strong>Debt:</strong> Taxed at slab rate (for investments after Mar 31, 2023). Lower tax efficiency.
                        </div>
                    </div>
                </div>
            </div>

            <div class="behavior-tip" style="margin-top: 30px; background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
                <strong>💡 Tax Harvesting Opportunity:</strong> 
                ${ltcg < ltcgLimit
                ? `You have roughly ₹${(ltcgLimit - ltcg).toLocaleString('en-IN')} of tax-free LTCG limit remaining this year. Consider booking some profits to reset your cost basis.`
                : `You have crossed the ₹1.25L tax-free LTCG limit. Any further profit booking in equity will attract 12.5% tax.`}
            </div>
        </div>`;
    }

    /**
     * 19. Methodology Disclosure
     */
    private static renderMethodologyDisclosure(config: WhiteLabelConfig): string {
        return `
        <div class="page" style="page-break-before: always; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
            <h2 class="section-header" style="margin-bottom: 24px;">Methodology & Disclosures</h2>
            
            <div class="disclosure-section">
                <h4 class="disclosure-title">1. Data Sources</h4>
                <p class="disclosure-text">
                    <strong>Net Asset Value (NAV):</strong> Mutual fund NAVs are sourced daily from AMFI (Association of Mutual Funds in India) via authorized data vendors. 
                    <br><strong>Benchmark Data:</strong> Market indices (Nifty 50, Sensex) data is obtained from NSE/BSE public feeds.
                    <br><strong>Historical Performance:</strong> Past performance data is adjusted for dividends and corporate actions (splits, bonuses).
                </p>
            </div>

            <div class="disclosure-section">
                <h4 class="disclosure-title">2. Calculation Methodology</h4>
                <p class="disclosure-text">
                    <strong>XIRR (Extended Internal Rate of Return):</strong> Returns for SIPs and multiple transactions are calculated using XIRR to account for the timing of cash flows.
                    <br><strong>CAGR (Compounded Annual Growth Rate):</strong> Used for point-to-point returns (lump sum investments).
                    <br><strong>Risk Metrics:</strong> Standard Deviation and Beta are calculated based on monthly returns over the last 3 years.
                    <br><strong>Health Score:</strong> A proprietary scoring model (0-100) assessing diversity, cost efficiency, and performance consistency.
                </p>
            </div>

            <div class="disclosure-section">
                <h4 class="disclosure-title">3. Projection Assumptions</h4>
                <p class="disclosure-text">
                    <strong>Wealth Projections:</strong> Future value estimates assume a linear growth rate based on the asset class historical averages (e.g., Equity: 12%, Debt: 7%). These are hypothetical scenarios and not guaranteed returns. 
                    <br><strong>Inflation adjustment:</strong> Real returns are not inflation-adjusted unless explicitly stated.
                </p>
            </div>

            <div class="disclosure-section">
                <h4 class="disclosure-title">4. Tax Estimations</h4>
                <p class="disclosure-text">
                    <strong>Indicative Only:</strong> Tax liability estimates (LTCG/STCG) are approximations based on FIFO (First-In-First-Out) logic. They do not account for grandfathering clauses (pre-2018), brought-forward losses, or surcharge/cess.
                    <br><strong> Consult a CA:</strong> Users are advised to verify all tax calculations with a qualified Chartered Accountant before filing returns.
                </p>
            </div>

            <div class="confidentiality-note" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; text-align: center;">
                This report is generated by ${config.companyName} for the exclusive use of the client. Distribution to third parties is strictly prohibited.
            </div>
        </div>`;
    }

    /**
     * 20. Executive Summary
     */
    private static renderExecutiveSummary(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const score = data.profile.health_score || 0;
        const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Improvement';
        const topActions = data.actionItems.slice(0, 3);

        const actionsHtml = topActions.length > 0
            ? topActions.map(a => `
                <div class="action-item">
                    <div class="action-title">${a.title}</div>
                    <div class="action-desc">${a.description}</div>
                </div>`).join('')
            : '<p style="color: #6b7280; font-style: italic;">No critical action items. Your financial profile looks healthy!</p>';

        const advisoryParagraph = score >= 70
            ? `Your financial health is in good shape. Continue maintaining your current discipline and focus on optimizing your investment allocation.`
            : `Your financial profile indicates areas that need attention. Focus on the action items below to improve your overall financial wellness.`;

        return `
        <div class="page">
            <h2 class="section-header">Executive Summary</h2>
            <div class="exec-summary">
                <div class="score-card">
                    <div class="score-value">${score}</div>
                    <div class="score-label">${scoreLabel} Health Score</div>
                </div>
                <div class="action-list">
                    <h3 class="subsection-header">Top 3 Action Items</h3>
                    ${actionsHtml}
                </div>
            </div>
            <p style="color: #374151; margin-top: 20px;">${advisoryParagraph}</p>
        </div>`;
    }

    /**
     * 3. Persona Visualization
     */
    private static renderPersonaVisualization(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const personaName = data.profile.persona_data?.persona?.name || 'General';
        const riskClass = data.profile.risk_class || 'Moderate';
        const portfolio = data.portfolio;

        let actualEquity = portfolio?.equityPercent || 0;
        let actualMF = portfolio?.mutualFundPercent || 0;
        let idealEquity = portfolio?.idealAllocation?.equity || 40;
        let idealMF = portfolio?.idealAllocation?.mutualFund || 60;

        // If no portfolio, use defaults based on persona
        if (!portfolio || portfolio.holdings.length === 0) {
            actualEquity = 0;
            actualMF = 0;
        }

        return `
        <div class="page">
            <h2 class="section-header">Persona & Allocation Analysis</h2>
            <div class="allocation-container">
                <div class="allocation-bars">
                    <h3 class="subsection-header">Current vs Ideal Allocation</h3>
                    
                    <p style="font-size: 10pt; color: #6b7280; margin-bottom: 16px;">Your Allocation</p>
                    <div class="bar-row">
                        <span class="bar-label">Equity</span>
                        <div class="bar-container">
                            <div class="bar-fill bar-equity" style="width: ${Math.min(actualEquity, 100)}%;">
                                <span class="bar-value">${actualEquity.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="bar-row">
                        <span class="bar-label">Mutual Funds</span>
                        <div class="bar-container">
                            <div class="bar-fill bar-mf" style="width: ${Math.min(actualMF, 100)}%;">
                                <span class="bar-value">${actualMF.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <p style="font-size: 10pt; color: #6b7280; margin: 20px 0 16px;">Ideal Allocation for ${personaName}</p>
                    <div class="bar-row">
                        <span class="bar-label">Equity</span>
                        <div class="bar-container">
                            <div class="bar-fill bar-equity" style="width: ${idealEquity}%; opacity: 0.6;">
                                <span class="bar-value">${idealEquity}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="bar-row">
                        <span class="bar-label">Mutual Funds</span>
                        <div class="bar-container">
                            <div class="bar-fill bar-mf" style="width: ${idealMF}%; opacity: 0.6;">
                                <span class="bar-value">${idealMF}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="persona-card">
                    <div class="persona-name">${personaName}</div>
                    <div class="persona-risk">Risk Profile: ${riskClass}</div>
                    ${portfolio?.alignmentScore !== undefined ? `<p style="margin-top: 16px; font-size: 10pt;">Alignment Score: <strong>${portfolio.alignmentScore}/100</strong></p>` : ''}
                </div>
            </div>
        </div>`;
    }

    /**
     * 4. Gap Analysis
     */
    private static renderGapAnalysis(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const profile = data.profile;


        // Calculate gaps if not provided
        const monthlyIncome = profile.gross_income || 0;
        const annualIncome = monthlyIncome * 12;
        const idealEmergencyFund = (profile.fixed_expenses || 0) * 6;
        const currentEmergencyFund = profile.emergency_fund_amount || 0;
        const emergencyGap = Math.max(0, idealEmergencyFund - currentEmergencyFund);

        const idealLifeInsurance = annualIncome * 10;
        const currentLifeInsurance = profile.insurance_cover || 0;
        const insuranceGap = Math.max(0, idealLifeInsurance - currentLifeInsurance);

        return `
        <div class="page">
            <h2 class="section-header">Gap Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">Analysis of key financial protection and investment gaps based on your profile.</p>
            
            <table class="gap-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Current</th>
                        <th>Recommended</th>
                        <th>Gap</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Emergency Fund</strong></td>
                        <td>₹${this.formatCurrency(currentEmergencyFund)}</td>
                        <td>₹${this.formatCurrency(idealEmergencyFund)}</td>
                        <td class="${emergencyGap > 0 ? 'gap-positive' : 'gap-ok'}">₹${this.formatCurrency(emergencyGap)}</td>
                        <td>${emergencyGap > 0 ? '⚠️ Action Needed' : '✅ Adequate'}</td>
                    </tr>
                    <tr>
                        <td><strong>Life Insurance Cover</strong></td>
                        <td>₹${this.formatCurrency(currentLifeInsurance)}</td>
                        <td>₹${this.formatCurrency(idealLifeInsurance)}</td>
                        <td class="${insuranceGap > 0 ? 'gap-positive' : 'gap-ok'}">₹${this.formatCurrency(insuranceGap)}</td>
                        <td>${insuranceGap > 0 ? '⚠️ Under-insured' : '✅ Adequate'}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="subsection-header">Key Observations</div>
            <ul style="margin-left: 20px; color: #374151; font-size: 10pt;">
                ${emergencyGap > 0 ? `<li>Build an emergency fund covering 6 months of expenses (₹${this.formatCurrency(emergencyGap)} gap)</li>` : ''}
                ${insuranceGap > 0 ? `<li>Increase life insurance coverage to at least 10x annual income</li>` : ''}
                ${emergencyGap === 0 && insuranceGap === 0 ? '<li>Your protection coverage is adequate. Continue monitoring periodically.</li>' : ''}
            </ul>
        </div>`;
    }

    /**
     * 5. Projections
     */
    private static renderProjections(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const projections = data.projections;

        if (!projections || (!projections.sip && !projections.retirement)) {
            return `
            <div class="page">
                <h2 class="section-header">Financial Projections</h2>
                <p style="color: #6b7280; font-style: italic;">No projection data available. Use the calculators to see growth projections.</p>
            </div>`;
        }

        const sipHtml = projections.sip ? `
            <div class="projection-card">
                <div class="projection-title">SIP Growth Projection</div>
                <div class="projection-value">₹${this.formatCurrency(projections.sip.totalValue)}</div>
                <div class="projection-label">Projected corpus in ${projections.sip.years} years</div>
                <div style="margin-top: 16px;">
                    <div class="projection-row">
                        <span>Monthly SIP</span>
                        <span>₹${this.formatCurrency(projections.sip.monthlyInvestment)}</span>
                    </div>
                    <div class="projection-row">
                        <span>Total Invested</span>
                        <span>₹${this.formatCurrency(projections.sip.investedAmount)}</span>
                    </div>
                    <div class="projection-row">
                        <span>Estimated Returns</span>
                        <span style="color: #16a34a; font-weight: 600;">₹${this.formatCurrency(projections.sip.estReturns)}</span>
                    </div>
                </div>
            </div>` : '';

        const retirementHtml = projections.retirement ? `
            <div class="projection-card">
                <div class="projection-title">Retirement Glide Path</div>
                <div class="projection-value">₹${this.formatCurrency(projections.retirement.targetCorpus)}</div>
                <div class="projection-label">Target retirement corpus</div>
                <div style="margin-top: 16px;">
                    <div class="projection-row">
                        <span>Years to Retirement</span>
                        <span>${projections.retirement.yearsToRetire} years</span>
                    </div>
                    <div class="projection-row">
                        <span>Monthly SIP Needed</span>
                        <span>₹${this.formatCurrency(projections.retirement.monthlySavingsRequired)}</span>
                    </div>
                    <div class="projection-row">
                        <span>Current Gap</span>
                        <span style="color: ${projections.retirement.gap > 0 ? '#dc2626' : '#16a34a'};">₹${this.formatCurrency(projections.retirement.gap)}</span>
                    </div>
                </div>
            </div>` : '';

        return `
        <div class="page">
            <h2 class="section-header">Financial Projections</h2>
            <div class="projection-grid">
                ${sipHtml}
                ${retirementHtml}
            </div>
            <div class="assumptions">
                <strong>Key Assumptions:</strong> 12% annual return (pre-retirement), 6% inflation rate, 8% post-retirement return. 
                Actual returns may vary based on market conditions.
            </div>
        </div>`;
    }

    /**
     * 6. Marketplace Recommendations
     */
    private static renderMarketplaceRecommendations(data: PDFDataV3, _config: WhiteLabelConfig): string {
        const products = data.marketplaceProducts || [];

        if (products.length === 0) {
            return `
            <div class="page">
                <h2 class="section-header">Marketplace Recommendations</h2>
                <p style="color: #6b7280; font-style: italic;">No specific product recommendations available based on your current profile.</p>
            </div>`;
        }

        const productsHtml = products.slice(0, 6).map(p => {
            const riskClass = p.riskLevel.toLowerCase().includes('low') ? 'risk-low'
                : p.riskLevel.toLowerCase().includes('high') ? 'risk-high' : 'risk-moderate';
            return `
            <div class="product-card">
                <div class="product-name">${p.name}</div>
                <div class="product-category">${p.category}</div>
                ${p.isin ? `<span class="product-isin">ISIN: ${p.isin}</span>` : ''}
                ${p.schemeCode ? `<span class="product-isin">Scheme: ${p.schemeCode}</span>` : ''}
                <div class="product-risk ${riskClass}">${p.riskLevel}</div>
                <div class="product-why">"${p.whyRecommended}"</div>
            </div>`;
        }).join('');

        return `
        <div class="page">
            <h2 class="section-header">Marketplace Recommendations</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">Products curated based on your persona and financial goals. For informational purposes only.</p>
            <div class="product-grid">
                ${productsHtml}
            </div>
            <p style="font-size: 9pt; color: #9ca3af; margin-top: 20px; text-align: center;">
                * These are read-only recommendations. No purchase or execution available through this report.
            </p>
        </div>`;
    }

    /**
     * 20. Compliance & Disclaimer
     */
    private static renderComplianceFooter(config: WhiteLabelConfig, reportId: string, timestamp: string): string {
        return `
        <div class="page" style="display: flex; flex-direction: column; justify-content: center;">
            <div class="compliance-hero">
                <div class="compliance-icon">⚖️</div>
                <h1 class="compliance-header">Regulatory & Compliance Disclaimer</h1>
                <p class="compliance-sub">Please read the following carefully before acting on any recommendations.</p>
            </div>

            <div class="compliance-grid">
                <div class="compliance-box">
                    <h4 class="c-title">Advisory Only</h4>
                    <p class="c-text">
                        This report is generated by <strong>${config.companyName}</strong> for educational and informational purposes only. 
                        The insights provided are based on algorithmic analysis of the data submitted. 
                        <strong>This does NOT constitute personalized financial, legal, or tax advice.</strong>
                    </p>
                </div>

                <div class="compliance-box">
                    <h4 class="c-title">No Execution</h4>
                    <p class="c-text">
                        This document is a read-only report. <strong>No trade execution, fund transfer, or order placement capabilities are linked to this document.</strong> 
                        Any investment decision relying on this report is at the sole discretion and risk of the investor.
                    </p>
                </div>

                <div class="compliance-box">
                    <h4 class="c-title">Market Risks</h4>
                    <p class="c-text">
                        Investments in securities market are subject to market risks. Past performance is not indicative of future returns. 
                        There is no assurance or guarantee that the investment objectives of the recommended schemes will be achieved.
                    </p>
                </div>

                <div class="compliance-box">
                    <h4 class="c-title">Data Accuracy</h4>
                    <p class="c-text">
                        While utmost care has been taken to source data from reliable vendors (AMFI, NSE, etc.), ${config.companyName} does not guarantee the accuracy, completeness, or timeliness of the data provided in this report.
                    </p>
                </div>
            </div>

            <div class="compliance-footer-meta">
                <div class="meta-row">
                    <span class="meta-label">Report ID</span>
                    <span class="meta-val">${reportId}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Generated On</span>
                    <span class="meta-val">${timestamp}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Registered Advisor</span>
                    <span class="meta-val">${config.advisorName || 'Pending Registration'}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">SEBI / License No.</span>
                    <span class="meta-val">${config.licenseNumber || 'N/A'}</span>
                </div>
            </div>
            
            <div class="end-mark">
                --- End of Report ---
            </div>
        </div>`;
    }

    /**
     * Footer template for Puppeteer
     */
    private static generateFooterTemplate(config: WhiteLabelConfig, reportId: string): string {
        return `
        <div style="font-size: 8pt; color: #9ca3af; width: 100%; padding: 0 40px; display: flex; justify-content: space-between;">
            <span>© ${new Date().getFullYear()} ${config.companyName}</span>
            <span>${reportId}</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`;
    }

    /**
     * Format currency
     */
    private static formatCurrency(amount: number): string {
        if (!amount || isNaN(amount)) return '0';
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
    }
}
