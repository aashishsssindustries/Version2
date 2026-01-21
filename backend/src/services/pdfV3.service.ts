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

export interface PDFDataV3 {
    user: UserData;
    profile: ProfileData;
    actionItems: ActionItem[];
    portfolio?: PortfolioData;
    gapAnalysis?: GapAnalysis;
    projections?: ProjectionData;
    marketplaceProducts?: MarketplaceProduct[];
    whiteLabel: WhiteLabelConfig;
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
     * Generate Advisory Report V3 using Puppeteer HTML-to-PDF
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
                args: ['--no-sandbox', '--disable-setuid-sandbox']
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
    <style>
        ${this.getStyles(config)}
    </style>
</head>
<body>
    ${this.renderCoverPage(data, config, generatedDate)}
    ${this.renderExecutiveSummary(data, config)}
    ${this.renderPersonaVisualization(data, config)}
    ${this.renderGapAnalysis(data, config)}
    ${this.renderProjections(data, config)}
    ${this.renderMarketplaceRecommendations(data, config)}
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
        .cover-page { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 90vh; }
        .cover-logo { max-height: 80px; margin-bottom: 20px; }
        .cover-company { font-size: 36pt; font-weight: 700; color: ${config.primaryColor}; margin-bottom: 8px; }
        .cover-tagline { font-size: 14pt; color: #6b7280; margin-bottom: 60px; }
        .cover-title { font-size: 28pt; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
        .cover-subtitle { font-size: 12pt; color: #6b7280; margin-bottom: 40px; }
        .cover-user { font-size: 18pt; color: #374151; margin-bottom: 10px; }
        .cover-date { font-size: 12pt; color: #9ca3af; }
        .cover-line { width: 200px; height: 3px; background: ${config.primaryColor}; margin: 40px auto; }
        
        /* Section Headers */
        .section-header { font-size: 18pt; font-weight: 700; color: ${config.primaryColor}; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid ${config.primaryColor}; }
        .subsection-header { font-size: 13pt; font-weight: 600; color: #374151; margin: 20px 0 12px; }
        
        /* Executive Summary */
        .exec-summary { display: flex; gap: 30px; margin-bottom: 30px; }
        .score-card { background: linear-gradient(135deg, ${config.primaryColor}15, ${config.primaryColor}05); border-radius: 12px; padding: 24px; text-align: center; flex: 0 0 180px; }
        .score-value { font-size: 48pt; font-weight: 700; color: ${config.primaryColor}; }
        .score-label { font-size: 10pt; color: #6b7280; }
        .action-list { flex: 1; }
        .action-item { background: #f9fafb; border-left: 4px solid ${config.primaryColor}; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0; }
        .action-title { font-weight: 600; color: #1f2937; }
        .action-desc { font-size: 10pt; color: #6b7280; margin-top: 4px; }
        
        /* Allocation Chart */
        .allocation-container { display: flex; gap: 40px; align-items: flex-start; }
        .allocation-bars { flex: 1; }
        .bar-row { display: flex; align-items: center; margin-bottom: 12px; }
        .bar-label { width: 100px; font-size: 10pt; color: #374151; }
        .bar-container { flex: 1; height: 24px; background: #e5e7eb; border-radius: 4px; overflow: hidden; position: relative; }
        .bar-fill { height: 100%; border-radius: 4px; }
        .bar-equity { background: linear-gradient(90deg, #22c55e, #16a34a); }
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

        return `
        <div class="page cover-page">
            ${logoHtml}
            <div class="cover-company">${config.companyName}</div>
            <div class="cover-tagline">Automated Financial Advisory</div>
            <div class="cover-line"></div>
            <div class="cover-title">Personal Financial Snapshot</div>
            <div class="cover-subtitle">Advisory Report v3.0</div>
            <div class="cover-user">Prepared for: ${data.user.name}</div>
            <div class="cover-date">Generated on: ${generatedDate}</div>
        </div>`;
    }

    /**
     * 2. Executive Summary
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
     * 7. Compliance Footer
     */
    private static renderComplianceFooter(config: WhiteLabelConfig, reportId: string, timestamp: string): string {
        return `
        <div class="page">
            <div class="compliance-section">
                <div class="compliance-title">⚠️ Important Disclaimer</div>
                <div class="compliance-text">
                    <p>This report is generated for <strong>educational and informational purposes only</strong>. The recommendations and projections provided are based on the financial data submitted and standard financial planning principles.</p>
                    <br/>
                    <p>${config.companyName} is an automated advisory platform and <strong>does not constitute professional financial advice</strong>. We strongly recommend consulting with a SEBI-registered investment advisor before making any significant financial decisions or investments.</p>
                    <br/>
                    <p>Past performance and projections are <strong>not indicative of future results</strong>. Investment returns are subject to market risks, and actual results may vary significantly from the estimates provided in this report.</p>
                    <br/>
                    <p><strong>For informational purposes only. Not an offer to buy or sell securities.</strong></p>
                </div>
                <div class="compliance-meta">
                    <span>Report ID: ${reportId}</span>
                    <span>Generated: ${timestamp}</span>
                    <span>Advisor: ${config.advisorName || 'N/A'} | License: ${config.licenseNumber || 'N/A'}</span>
                </div>
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
