import PDFDocument from 'pdfkit';
import { randomUUID } from 'crypto';

// ============================================
// Interfaces
// ============================================

interface BrandingConfig {
    companyName: string;
    tagline?: string;
    primaryColor: string;
    secondaryColor?: string;
    footerText?: string;
    disclaimerAddendum?: string;
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
    employment_type?: string;
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

interface PortfolioAnalytics {
    holdings: PortfolioHolding[];
    totalValuation: number;
    equityPercent: number;
    mutualFundPercent: number;
    alignmentScore?: number;
    advisoryFlags?: Array<{ title: string; message: string; type: string }>;
}

interface CalculatorSummary {
    sip?: {
        monthlyInvestment: number;
        years: number;
        totalValue: number;
        investedAmount: number;
        estReturns: number;
    };
    retirement?: {
        yearsToRetire: number;
        targetCorpus: number;
        monthlySavingsRequired: number;
        gap: number;
    };
}

interface PDFDataV2 {
    user: UserData;
    profile: ProfileData;
    actionItems: ActionItem[];
    portfolio?: PortfolioAnalytics;
    calculatorSummary?: CalculatorSummary;
    branding?: BrandingConfig;
}

// ============================================
// Default Branding
// ============================================

const DEFAULT_BRANDING: BrandingConfig = {
    companyName: 'WealthMax',
    tagline: 'Automated Financial Advisory',
    primaryColor: '#1a56db',
    secondaryColor: '#6b7280',
    footerText: '© 2026 WealthMax. All rights reserved.',
    disclaimerAddendum: ''
};

// ============================================
// 30-30-30-10 Rule Data
// ============================================

const ALLOCATION_RULE = [
    { id: 'needs', label: 'Needs', percentage: 30, color: '#6366f1' },
    { id: 'wants', label: 'Wants', percentage: 30, color: '#8b5cf6' },
    { id: 'savings', label: 'Savings', percentage: 30, color: '#22c55e' },
    { id: 'protection', label: 'Protection', percentage: 10, color: '#f59e0b' }
];

// ============================================
// PDF Service V2
// ============================================

export class PDFServiceV2 {
    private static readonly FONTS = {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold',
        italic: 'Helvetica-Oblique'
    };

    private static readonly COLORS = {
        text: '#1f2937',
        lightGray: '#f3f4f6',
        white: '#ffffff',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
    };

    /**
     * Generate White-Labeled Advisory Report V2
     */
    static async generateAdvisoryReportV2(data: PDFDataV2): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const branding = { ...DEFAULT_BRANDING, ...data.branding };
            const reportId = `WM-${randomUUID().slice(0, 8).toUpperCase()}`;
            const timestamp = new Date().toISOString();
            const generatedDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 70, left: 50, right: 50 },
                bufferPages: true,
                info: {
                    Title: `${branding.companyName} Advisory Report`,
                    Author: branding.companyName,
                    Subject: 'Personal Financial Snapshot',
                    Keywords: 'financial, advisory, report'
                }
            });

            const buffers: Buffer[] = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // Generate all sections
            this.addCoverPageV2(doc, data, branding, reportId, generatedDate);
            this.addProfileSummaryV2(doc, data, branding);
            this.addPersonaVisualization(doc, data, branding);
            if (data.portfolio && data.portfolio.holdings.length > 0) {
                this.addPortfolioAnalytics(doc, data, branding);
            }
            this.addKeyFindings(doc, data, branding);
            this.addRecommendations(doc, data, branding);
            if (data.calculatorSummary) {
                this.addCalculatorSummary(doc, data, branding);
            }
            this.addComplianceDisclaimer(doc, branding, reportId, timestamp);

            // Add page numbers and footer to all pages
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                this.addPageFooter(doc, branding, i + 1, pages.count, reportId);
            }

            doc.end();
        });
    }

    // ==================== Cover Page ====================

    private static addCoverPageV2(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig,
        reportId: string,
        generatedDate: string
    ): void {
        // Company Branding
        doc.fontSize(36)
            .font(this.FONTS.bold)
            .fillColor(branding.primaryColor)
            .text(branding.companyName, { align: 'center' });

        if (branding.tagline) {
            doc.moveDown(0.5);
            doc.fontSize(14)
                .font(this.FONTS.regular)
                .fillColor(branding.secondaryColor || this.COLORS.text)
                .text(branding.tagline, { align: 'center' });
        }

        doc.moveDown(4);

        // Main Title
        doc.fontSize(28)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.text)
            .text('Personal Financial Snapshot', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(12)
            .font(this.FONTS.regular)
            .fillColor(branding.secondaryColor || this.COLORS.text)
            .text('Advisory Report v2.0', { align: 'center' });

        doc.moveDown(3);

        // User Name
        doc.fontSize(18)
            .font(this.FONTS.regular)
            .fillColor(branding.secondaryColor || this.COLORS.text)
            .text(`Prepared for: ${data.user.name}`, { align: 'center' });

        doc.moveDown(1);

        // Date & Report ID
        doc.fontSize(12)
            .fillColor(branding.secondaryColor || this.COLORS.text)
            .text(`Generated: ${generatedDate}`, { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(10)
            .fillColor(this.COLORS.lightGray)
            .text(`Report ID: ${reportId}`, { align: 'center' });

        // Decorative Line
        doc.moveDown(3);
        const pageWidth = doc.page.width - 100;
        doc.strokeColor(branding.primaryColor)
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(50 + pageWidth, doc.y)
            .stroke();

        doc.addPage();
    }

    // ==================== Profile Summary ====================

    private static addProfileSummaryV2(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig
    ): void {
        this.addSectionHeader(doc, 'Profile Summary', branding);

        const profile = data.profile;
        const personaName = profile.persona_data?.persona?.name || 'General';
        const behaviorLabel = profile.persona_data?.behavior?.label || 'Balanced';
        const riskClass = profile.risk_class || 'Moderate';

        const leftX = 70;
        const rightX = 320;
        const lineHeight = 25;
        let currentY = doc.y;

        // Left Column
        this.addLabelValue(doc, 'Age:', `${profile.age} years`, leftX, currentY);
        currentY += lineHeight;
        this.addLabelValue(doc, 'Employment:', profile.employment_type || 'Salaried', leftX, currentY);
        currentY += lineHeight;
        this.addLabelValue(doc, 'Annual Income:', `₹${this.formatCurrency(profile.gross_income * 12)}`, leftX, currentY);

        // Right Column
        currentY -= lineHeight * 2;
        this.addLabelValue(doc, 'Persona:', personaName, rightX, currentY);
        currentY += lineHeight;
        this.addLabelValue(doc, 'Behavior:', behaviorLabel, rightX, currentY);
        currentY += lineHeight;
        this.addLabelValue(doc, 'Risk Category:', riskClass, rightX, currentY);

        // Financial Health Score
        doc.moveDown(3);
        this.addSubsectionHeader(doc, 'Financial Health Score', branding);

        const score = profile.health_score || 0;
        const scoreColor = this.getScoreColor(score);

        doc.fontSize(48)
            .font(this.FONTS.bold)
            .fillColor(scoreColor)
            .text(`${score}/100`, { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(11)
            .font(this.FONTS.regular)
            .fillColor(branding.secondaryColor || this.COLORS.text)
            .text(this.getScoreLabel(score), { align: 'center' });

        doc.moveDown(2);
        this.addDivider(doc);
    }

    // ==================== Persona Visualization (30-30-30-10) ====================

    private static addPersonaVisualization(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig
    ): void {
        this.addSectionHeader(doc, 'Recommended Budget Allocation', branding);

        doc.fontSize(11)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.text)
            .text('Based on the 30-30-30-10 rule - a balanced approach to managing your income:', { align: 'left' });

        doc.moveDown(1);

        // Draw allocation bars
        const barStartX = 70;
        const barWidth = 400;
        const barHeight = 24;
        let currentY = doc.y;

        ALLOCATION_RULE.forEach((segment) => {
            const segmentWidth = (segment.percentage / 100) * barWidth;

            // Color bar
            doc.rect(barStartX, currentY, segmentWidth, barHeight)
                .fillColor(segment.color)
                .fill();

            // Label
            doc.fontSize(10)
                .font(this.FONTS.bold)
                .fillColor(this.COLORS.white)
                .text(`${segment.label} ${segment.percentage}%`, barStartX + 8, currentY + 7, { width: segmentWidth - 16 });

            currentY += barHeight + 8;
        });

        // Description
        doc.moveDown(1);
        doc.fontSize(10)
            .font(this.FONTS.italic)
            .fillColor(branding.secondaryColor || this.COLORS.text)
            .text('• Needs: Rent, utilities, groceries, EMIs, insurance premiums', barStartX);
        doc.text('• Wants: Dining, entertainment, travel, lifestyle spending', barStartX);
        doc.text('• Savings: Investments, emergency fund, retirement corpus', barStartX);
        doc.text('• Protection: Term insurance, health insurance, contingency buffer', barStartX);

        // User's actual allocation (if available)
        if (data.profile.fixed_expenses && data.profile.monthly_emi) {
            doc.moveDown(1.5);
            const monthlyIncome = data.profile.gross_income;
            const actualNeeds = ((data.profile.fixed_expenses + data.profile.monthly_emi) / monthlyIncome) * 100;

            doc.fontSize(10)
                .font(this.FONTS.bold)
                .fillColor(branding.primaryColor)
                .text(`Your Current Needs Allocation: ${actualNeeds.toFixed(1)}%`, barStartX);

            if (actualNeeds > 35) {
                doc.font(this.FONTS.regular)
                    .fillColor(this.COLORS.warning)
                    .text('⚠ Your essential expenses exceed the recommended 30%. Consider reviewing fixed costs.', barStartX);
            }
        }

        doc.moveDown(2);
        this.addDivider(doc);
    }

    // ==================== Portfolio Analytics ====================

    private static addPortfolioAnalytics(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig
    ): void {
        this.addSectionHeader(doc, 'Portfolio Analytics', branding);

        const portfolio = data.portfolio!;

        // Summary stats
        const leftX = 70;
        const rightX = 320;
        let currentY = doc.y;

        this.addLabelValue(doc, 'Total Holdings:', `${portfolio.holdings.length}`, leftX, currentY);
        this.addLabelValue(doc, 'Total Valuation:', `₹${this.formatCurrency(portfolio.totalValuation)}`, rightX, currentY);

        currentY += 30;
        this.addLabelValue(doc, 'Equity Allocation:', `${portfolio.equityPercent.toFixed(1)}%`, leftX, currentY);
        this.addLabelValue(doc, 'Mutual Funds:', `${portfolio.mutualFundPercent.toFixed(1)}%`, rightX, currentY);

        // Alignment score (if available)
        if (portfolio.alignmentScore !== undefined) {
            doc.moveDown(2);
            const alignmentColor = portfolio.alignmentScore >= 70 ? this.COLORS.success :
                portfolio.alignmentScore >= 50 ? this.COLORS.warning : this.COLORS.danger;

            doc.fontSize(12)
                .font(this.FONTS.bold)
                .fillColor(this.COLORS.text)
                .text('Portfolio Alignment Score:', leftX);

            doc.fontSize(24)
                .font(this.FONTS.bold)
                .fillColor(alignmentColor)
                .text(`${portfolio.alignmentScore}/100`, leftX + 200, doc.y - 20);
        }

        // Advisory flags
        if (portfolio.advisoryFlags && portfolio.advisoryFlags.length > 0) {
            doc.moveDown(2);
            this.addSubsectionHeader(doc, 'Portfolio Insights', branding);

            portfolio.advisoryFlags.slice(0, 3).forEach(flag => {
                const flagColor = flag.type === 'warning' ? this.COLORS.warning :
                    flag.type === 'suggestion' ? branding.primaryColor : this.COLORS.text;

                doc.fontSize(10)
                    .font(this.FONTS.bold)
                    .fillColor(flagColor)
                    .text(`• ${flag.title}`, leftX);

                doc.font(this.FONTS.regular)
                    .fillColor(this.COLORS.text)
                    .text(`  ${flag.message}`, leftX, doc.y, { width: 450 });

                doc.moveDown(0.5);
            });
        }

        // Top 5 holdings table
        if (portfolio.holdings.length > 0) {
            doc.moveDown(1);
            this.addSubsectionHeader(doc, 'Top Holdings', branding);

            const tableTop = doc.y;
            const colWidths = [200, 80, 80, 100];
            const headers = ['Name', 'Type', 'Qty', 'Valuation'];

            // Header row
            let colX = leftX;
            headers.forEach((header, i) => {
                doc.fontSize(9)
                    .font(this.FONTS.bold)
                    .fillColor(branding.secondaryColor || this.COLORS.text)
                    .text(header, colX, tableTop, { width: colWidths[i] });
                colX += colWidths[i];
            });

            doc.moveDown(0.5);
            let rowY = doc.y;

            portfolio.holdings.slice(0, 5).forEach(holding => {
                colX = leftX;
                doc.fontSize(9).font(this.FONTS.regular).fillColor(this.COLORS.text);

                doc.text(holding.name.length > 25 ? holding.name.substring(0, 22) + '...' : holding.name, colX, rowY, { width: colWidths[0] });
                colX += colWidths[0];

                doc.text(holding.type === 'MUTUAL_FUND' ? 'MF' : 'EQ', colX, rowY, { width: colWidths[1] });
                colX += colWidths[1];

                doc.text(holding.quantity.toString(), colX, rowY, { width: colWidths[2] });
                colX += colWidths[2];

                doc.text(holding.last_valuation ? `₹${this.formatCurrency(holding.last_valuation)}` : '—', colX, rowY, { width: colWidths[3] });

                rowY += 16;
            });
        }

        doc.moveDown(2);
        this.addDivider(doc);
    }

    // ==================== Key Findings ====================

    private static addKeyFindings(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig
    ): void {
        this.addSectionHeader(doc, 'Key Findings', branding);

        const topRisks = data.actionItems
            .filter(item => item.priority === 'High')
            .slice(0, 3);

        if (topRisks.length === 0) {
            doc.fontSize(11)
                .font(this.FONTS.italic)
                .fillColor(branding.secondaryColor || this.COLORS.text)
                .text('No critical financial risks detected. Your financial profile looks healthy!');
        } else {
            topRisks.forEach((risk, index) => {
                this.addNumberedItem(doc, index + 1, risk.title, risk.description, this.COLORS.danger);
                doc.moveDown(1);
            });
        }

        doc.moveDown(1);
        this.addDivider(doc);
    }

    // ==================== Recommendations ====================

    private static addRecommendations(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig
    ): void {
        this.addSectionHeader(doc, 'Recommended Actions', branding);

        const topActions = data.actionItems.slice(0, 3);

        if (topActions.length === 0) {
            doc.fontSize(11)
                .font(this.FONTS.italic)
                .fillColor(branding.secondaryColor || this.COLORS.text)
                .text('No specific action items at this time. Continue maintaining your financial discipline!');
        } else {
            topActions.forEach((action, index) => {
                this.addNumberedItem(doc, index + 1, action.title, action.description, branding.primaryColor);

                if (action.gap_amount && action.gap_amount > 0) {
                    doc.fontSize(10)
                        .font(this.FONTS.bold)
                        .fillColor(this.COLORS.warning)
                        .text(`   Gap: ₹${this.formatCurrency(action.gap_amount)}`, 100);
                }

                if (action.estimated_score_impact && action.estimated_score_impact > 0) {
                    doc.fontSize(10)
                        .font(this.FONTS.regular)
                        .fillColor(this.COLORS.success)
                        .text(`   Potential Score Impact: +${action.estimated_score_impact}`, 100);
                }

                doc.moveDown(1);
            });
        }

        doc.moveDown(1);
        this.addDivider(doc);
    }

    // ==================== Calculator Summary ====================

    private static addCalculatorSummary(
        doc: PDFKit.PDFDocument,
        data: PDFDataV2,
        branding: BrandingConfig
    ): void {
        const calc = data.calculatorSummary;
        if (!calc || (!calc.sip && !calc.retirement)) return;

        this.addSectionHeader(doc, 'Financial Projections', branding);

        if (calc.sip) {
            this.addSubsectionHeader(doc, 'SIP Investment Projection', branding);

            const leftX = 70;
            let currentY = doc.y;

            this.addLabelValue(doc, 'Monthly Investment:', `₹${this.formatCurrency(calc.sip.monthlyInvestment)}`, leftX, currentY);
            currentY += 20;
            this.addLabelValue(doc, 'Investment Period:', `${calc.sip.years} years`, leftX, currentY);

            doc.moveDown(1);
            doc.fontSize(13).font(this.FONTS.bold).fillColor(branding.primaryColor)
                .text(`Projected Value: ₹${this.formatCurrency(calc.sip.totalValue)}`, { align: 'center' });

            doc.moveDown(1.5);
        }

        if (calc.retirement) {
            this.addSubsectionHeader(doc, 'Retirement Planning', branding);

            const leftX = 70;
            let currentY = doc.y;

            this.addLabelValue(doc, 'Years to Retirement:', `${calc.retirement.yearsToRetire} years`, leftX, currentY);
            currentY += 20;
            this.addLabelValue(doc, 'Target Corpus:', `₹${this.formatCurrency(calc.retirement.targetCorpus)}`, leftX, currentY);
            currentY += 20;
            this.addLabelValue(doc, 'Monthly SIP Needed:', `₹${this.formatCurrency(calc.retirement.monthlySavingsRequired)}`, leftX, currentY);

            doc.moveDown(1.5);
        }

        this.addDivider(doc);
    }

    // ==================== Compliance Disclaimer ====================

    private static addComplianceDisclaimer(
        doc: PDFKit.PDFDocument,
        branding: BrandingConfig,
        reportId: string,
        timestamp: string
    ): void {
        if (doc.y > doc.page.margins.top) {
            doc.addPage();
        }

        this.addSectionHeader(doc, 'Important Disclaimer', { ...branding, primaryColor: this.COLORS.danger });

        doc.fontSize(10)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.text)
            .text(
                'This report is generated for educational and informational purposes only. ' +
                'The recommendations and projections provided are based on the financial data you have submitted ' +
                'and standard financial planning principles.',
                { align: 'justify', lineGap: 4 }
            );

        doc.moveDown(1);

        doc.text(
            `${branding.companyName} is an automated advisory platform and does not constitute professional financial advice. ` +
            'We strongly recommend consulting with a SEBI-registered investment advisor before making any significant ' +
            'financial decisions or investments.',
            { align: 'justify', lineGap: 4 }
        );

        doc.moveDown(1);

        doc.text(
            'Past performance and projections are not indicative of future results. Investment returns are subject ' +
            'to market risks, and actual results may vary significantly from the estimates provided in this report.',
            { align: 'justify', lineGap: 4 }
        );

        if (branding.disclaimerAddendum) {
            doc.moveDown(1);
            doc.text(branding.disclaimerAddendum, { align: 'justify', lineGap: 4 });
        }

        doc.moveDown(2);

        // Report metadata
        doc.fontSize(9)
            .fillColor(branding.secondaryColor || this.COLORS.text)
            .text(`Report ID: ${reportId}`, { align: 'center' });

        doc.text(`Generated: ${timestamp}`, { align: 'center' });
    }

    // ==================== Page Footer ====================

    private static addPageFooter(
        doc: PDFKit.PDFDocument,
        branding: BrandingConfig,
        pageNum: number,
        totalPages: number,
        reportId: string
    ): void {
        const footerY = doc.page.height - 40;

        doc.fontSize(8)
            .font(this.FONTS.regular)
            .fillColor(branding.secondaryColor || '#6b7280');

        // Left: Branding
        doc.text(branding.footerText || `© ${new Date().getFullYear()} ${branding.companyName}`, 50, footerY);

        // Center: Report ID
        doc.text(reportId, doc.page.width / 2 - 40, footerY);

        // Right: Page number
        doc.text(`Page ${pageNum} of ${totalPages}`, doc.page.width - 100, footerY);
    }

    // ==================== Helper Methods ====================

    private static addSectionHeader(doc: PDFKit.PDFDocument, title: string, branding: BrandingConfig): void {
        doc.fontSize(16)
            .font(this.FONTS.bold)
            .fillColor(branding.primaryColor)
            .text(title);
        doc.moveDown(1);
    }

    private static addSubsectionHeader(doc: PDFKit.PDFDocument, title: string, _branding: BrandingConfig): void {
        doc.fontSize(12)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.text)
            .text(title);
        doc.moveDown(0.5);
    }

    private static addDivider(doc: PDFKit.PDFDocument): void {
        const pageWidth = doc.page.width - 100;
        doc.strokeColor(this.COLORS.lightGray)
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(50 + pageWidth, doc.y)
            .stroke();
        doc.moveDown(1.5);
    }

    private static addLabelValue(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number): void {
        doc.fontSize(11).font(this.FONTS.bold).fillColor('#6b7280').text(label, x, y);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text).text(value, x + 120, y);
    }

    private static addNumberedItem(doc: PDFKit.PDFDocument, num: number, title: string, desc: string, color: string): void {
        const startY = doc.y;

        doc.fontSize(14).font(this.FONTS.bold).fillColor(color).text(`${num}.`, 70, startY);
        doc.fontSize(12).font(this.FONTS.bold).fillColor(this.COLORS.text).text(title, 100, startY, { width: 450 });
        doc.moveDown(0.3);
        doc.fontSize(10).font(this.FONTS.regular).fillColor('#6b7280').text(desc, 100, doc.y, { width: 450, align: 'justify' });
    }

    private static getScoreColor(score: number): string {
        if (score >= 80) return this.COLORS.success;
        if (score >= 60) return this.COLORS.warning;
        return this.COLORS.danger;
    }

    private static getScoreLabel(score: number): string {
        if (score >= 80) return 'Excellent Financial Health';
        if (score >= 60) return 'Good Financial Health';
        if (score >= 40) return 'Fair Financial Health';
        return 'Needs Improvement';
    }

    private static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
    }
}
