import PDFDocument from 'pdfkit';
import { SIPProjectionData, RetirementGlidePathData } from './projection.service';

interface UserData {
    name: string;
    email: string;
}

interface ProfileData {
    age: number;
    gross_income: number;
    employment_type?: string;
    health_score: number;
    persona_data?: {
        persona?: {
            name: string;
            id: string;
        };
        behavior?: {
            label: string;
        };
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
    action?: string;
}

interface CalculatorSummary {
    sip?: {
        monthlyInvestment: number;
        years: number;
        totalValue: number;
        investedAmount: number;
        estReturns: number;
        yearlyData?: SIPProjectionData[];
    };
    retirement?: {
        yearsToRetire: number;
        targetCorpus: number;
        monthlySavingsRequired: number;
        gap: number;
        yearlyData?: RetirementGlidePathData[];
    };
}

interface PDFData {
    user: UserData;
    profile: ProfileData;
    actionItems: ActionItem[];
    calculatorSummary?: CalculatorSummary;
    generatedDate: string;
}

export class PDFService {
    private static readonly COLORS = {
        primary: '#1a56db',      // WealthMax Blue
        secondary: '#6b7280',    // Gray
        success: '#10b981',      // Green
        warning: '#f59e0b',      // Orange
        danger: '#ef4444',       // Red
        text: '#1f2937',         // Dark Gray
        lightGray: '#f3f4f6',    // Light Gray
        white: '#ffffff'
    };

    private static readonly FONTS = {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold',
        italic: 'Helvetica-Oblique'
    };

    /**
     * Generate Advisory PDF Report
     */
    static async generateAdvisoryReport(data: PDFData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                },
                info: {
                    Title: 'WealthMax Advisory Report',
                    Author: 'WealthMax',
                    Subject: 'Personal Financial Snapshot',
                    Keywords: 'financial, advisory, report'
                }
            });

            // Collect data chunks
            const buffers: Buffer[] = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', (err) => reject(err));

            // Generate all sections
            this.addCoverPage(doc, data);
            this.addProfileSummary(doc, data);
            this.addKeyFindings(doc, data);
            this.addRecommendations(doc, data);
            this.addCalculatorSummary(doc, data);
            this.addDisclaimer(doc);

            // Finalize PDF
            doc.end();
        });
    }

    /**
     * Cover Page
     */
    private static addCoverPage(doc: PDFKit.PDFDocument, data: PDFData): void {
        // WealthMax Logo/Branding (Text-based)
        doc.fontSize(36)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.primary)
            .text('WealthMax', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(14)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.secondary)
            .text('Automated Financial Advisory', { align: 'center' });

        doc.moveDown(4);

        // Main Title
        doc.fontSize(28)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.text)
            .text('Personal Financial Snapshot', { align: 'center' });

        doc.moveDown(2);

        // User Name
        doc.fontSize(18)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.secondary)
            .text(`Prepared for: ${data.user.name}`, { align: 'center' });

        doc.moveDown(1);

        // Date
        doc.fontSize(12)
            .fillColor(this.COLORS.secondary)
            .text(`Generated on: ${data.generatedDate}`, { align: 'center' });

        // Decorative Line
        doc.moveDown(3);
        const pageWidth = doc.page.width - 100;
        doc.strokeColor(this.COLORS.primary)
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(50 + pageWidth, doc.y)
            .stroke();

        // Add new page for content
        doc.addPage();
    }

    /**
     * Profile Summary Section
     */
    private static addProfileSummary(doc: PDFKit.PDFDocument, data: PDFData): void {
        this.addSectionHeader(doc, 'Profile Summary');

        const profile = data.profile;
        const personaName = profile.persona_data?.persona?.name || 'General';
        const behaviorLabel = profile.persona_data?.behavior?.label || 'Balanced';
        const riskClass = profile.risk_class || 'Moderate';

        // Create a table-like layout
        const leftX = 70;
        const rightX = 320;
        const lineHeight = 25;
        let currentY = doc.y;

        // Left Column
        doc.fontSize(11).font(this.FONTS.bold).fillColor(this.COLORS.secondary);
        doc.text('Age:', leftX, currentY);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
        doc.text(`${profile.age} years`, leftX + 120, currentY);

        currentY += lineHeight;
        doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
        doc.text('Employment:', leftX, currentY);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
        doc.text(profile.employment_type || 'Salaried', leftX + 120, currentY);

        currentY += lineHeight;
        doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
        doc.text('Annual Income:', leftX, currentY);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
        doc.text(`₹${this.formatCurrency(profile.gross_income * 12)}`, leftX + 120, currentY);

        // Right Column
        currentY = doc.y - (lineHeight * 3);
        doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
        doc.text('Persona:', rightX, currentY);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
        doc.text(personaName, rightX + 120, currentY, { width: 150 });

        currentY += lineHeight;
        doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
        doc.text('Behavior:', rightX, currentY);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
        doc.text(behaviorLabel, rightX + 120, currentY);

        currentY += lineHeight;
        doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
        doc.text('Risk Category:', rightX, currentY);
        doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
        doc.text(riskClass, rightX + 120, currentY);

        // Financial Health Score (Prominent)
        doc.moveDown(3);
        this.addSubsectionHeader(doc, 'Financial Health Score');

        const score = profile.health_score || 0;
        const scoreColor = this.getScoreColor(score);

        doc.fontSize(48)
            .font(this.FONTS.bold)
            .fillColor(scoreColor)
            .text(`${score}/100`, { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(11)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.secondary)
            .text(this.getScoreLabel(score), { align: 'center' });

        doc.moveDown(2);
        this.addDivider(doc);
    }

    /**
     * Key Findings Section
     */
    private static addKeyFindings(doc: PDFKit.PDFDocument, data: PDFData): void {
        this.addSectionHeader(doc, 'Key Findings');

        // Get top 3 high-priority action items as "risks"
        const topRisks = data.actionItems
            .filter(item => item.priority === 'High')
            .slice(0, 3);

        if (topRisks.length === 0) {
            doc.fontSize(11)
                .font(this.FONTS.italic)
                .fillColor(this.COLORS.secondary)
                .text('No critical financial risks detected. Your financial profile looks healthy!');
        } else {
            topRisks.forEach((risk, index) => {
                this.addRiskItem(doc, index + 1, risk);
                doc.moveDown(1.5);
            });
        }

        doc.moveDown(1);
        this.addDivider(doc);
    }

    /**
     * Recommendations Section
     */
    private static addRecommendations(doc: PDFKit.PDFDocument, data: PDFData): void {
        this.addSectionHeader(doc, 'Recommended Actions');

        // Get top 3 action items (prioritized)
        const topActions = data.actionItems.slice(0, 3);

        if (topActions.length === 0) {
            doc.fontSize(11)
                .font(this.FONTS.italic)
                .fillColor(this.COLORS.secondary)
                .text('No specific action items at this time. Continue maintaining your financial discipline!');
        } else {
            topActions.forEach((action, index) => {
                this.addActionItem(doc, index + 1, action);
                doc.moveDown(1.5);
            });
        }

        doc.moveDown(1);
        this.addDivider(doc);
    }

    /**
     * Calculator Summary Section
     */
    private static addCalculatorSummary(doc: PDFKit.PDFDocument, data: PDFData): void {
        this.addSectionHeader(doc, 'Financial Projections');

        const calc = data.calculatorSummary;

        if (!calc || (!calc.sip && !calc.retirement)) {
            doc.fontSize(11)
                .font(this.FONTS.italic)
                .fillColor(this.COLORS.secondary)
                .text('No calculator projections available. Use our SIP and Retirement calculators to plan your financial future.');
            doc.moveDown(2);
            this.addDivider(doc);
            return;
        }

        // SIP Summary
        if (calc.sip) {
            this.addSubsectionHeader(doc, 'SIP Investment Projection');

            const leftX = 70;
            const rightX = 320;
            let currentY = doc.y;

            doc.fontSize(11).font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Monthly Investment:', leftX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
            doc.text(`₹${this.formatCurrency(calc.sip.monthlyInvestment)}`, leftX + 150, currentY);

            currentY += 20;
            doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Investment Period:', leftX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
            doc.text(`${calc.sip.years} years`, leftX + 150, currentY);

            currentY = doc.y - 40;
            doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Total Invested:', rightX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
            doc.text(`₹${this.formatCurrency(calc.sip.investedAmount)}`, rightX + 120, currentY);

            currentY += 20;
            doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Estimated Returns:', rightX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.success);
            doc.text(`₹${this.formatCurrency(calc.sip.estReturns)}`, rightX + 120, currentY);

            doc.moveDown(2);
            doc.fontSize(13).font(this.FONTS.bold).fillColor(this.COLORS.primary);
            doc.text(`Projected Value: ₹${this.formatCurrency(calc.sip.totalValue)}`, { align: 'center' });

            doc.moveDown(2);
        }

        // Retirement Summary
        if (calc.retirement) {
            this.addSubsectionHeader(doc, 'Retirement Planning');

            const leftX = 70;
            const rightX = 320;
            let currentY = doc.y;

            doc.fontSize(11).font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Years to Retirement:', leftX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
            doc.text(`${calc.retirement.yearsToRetire} years`, leftX + 150, currentY);

            currentY += 20;
            doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Target Corpus:', leftX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
            doc.text(`₹${this.formatCurrency(calc.retirement.targetCorpus)}`, leftX + 150, currentY);

            currentY = doc.y - 40;
            doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Current Gap:', rightX, currentY);
            const gapColor = calc.retirement.gap > 0 ? this.COLORS.warning : this.COLORS.success;
            doc.font(this.FONTS.regular).fillColor(gapColor);
            doc.text(`₹${this.formatCurrency(calc.retirement.gap)}`, rightX + 120, currentY);

            currentY += 20;
            doc.font(this.FONTS.bold).fillColor(this.COLORS.secondary);
            doc.text('Monthly SIP Needed:', rightX, currentY);
            doc.font(this.FONTS.regular).fillColor(this.COLORS.text);
            doc.text(`₹${this.formatCurrency(calc.retirement.monthlySavingsRequired)}`, rightX + 120, currentY);

            doc.moveDown(2);
        }

        this.addDivider(doc);
    }

    /**
     * Disclaimer Section
     */
    private static addDisclaimer(doc: PDFKit.PDFDocument): void {
        // Add new page for disclaimer
        doc.addPage();

        this.addSectionHeader(doc, 'Important Disclaimer');

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
            'WealthMax is an automated advisory platform and does not constitute professional financial advice. ' +
            'We strongly recommend consulting with a certified financial advisor before making any significant ' +
            'financial decisions or investments.',
            { align: 'justify', lineGap: 4 }
        );

        doc.moveDown(1);

        doc.text(
            'Past performance and projections are not indicative of future results. Investment returns are subject ' +
            'to market risks, and actual results may vary significantly from the estimates provided in this report.',
            { align: 'justify', lineGap: 4 }
        );

        doc.moveDown(2);

        doc.fontSize(9)
            .fillColor(this.COLORS.secondary)
            .text('© 2026 WealthMax. All rights reserved.', { align: 'center' });
    }

    // ==================== Helper Methods ====================

    private static addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
        doc.fontSize(16)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.primary)
            .text(title);
        doc.moveDown(1);
    }

    private static addSubsectionHeader(doc: PDFKit.PDFDocument, title: string): void {
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

    private static addRiskItem(doc: PDFKit.PDFDocument, number: number, risk: ActionItem): void {
        const startY = doc.y;

        // Number badge
        doc.fontSize(14)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.danger)
            .text(`${number}.`, 70, startY);

        // Risk title
        doc.fontSize(12)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.text)
            .text(risk.title, 100, startY, { width: 450 });

        doc.moveDown(0.3);

        // Risk description
        doc.fontSize(10)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.secondary)
            .text(risk.description, 100, doc.y, { width: 450, align: 'justify' });
    }

    private static addActionItem(doc: PDFKit.PDFDocument, number: number, action: ActionItem): void {
        const startY = doc.y;

        // Number badge
        doc.fontSize(14)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.primary)
            .text(`${number}.`, 70, startY);

        // Action title
        doc.fontSize(12)
            .font(this.FONTS.bold)
            .fillColor(this.COLORS.text)
            .text(action.title, 100, startY, { width: 450 });

        doc.moveDown(0.3);

        // Action description
        doc.fontSize(10)
            .font(this.FONTS.regular)
            .fillColor(this.COLORS.secondary)
            .text(action.description, 100, doc.y, { width: 450, align: 'justify' });

        // Gap amount (if available)
        if (action.gap_amount && action.gap_amount > 0) {
            doc.moveDown(0.3);
            doc.fontSize(10)
                .font(this.FONTS.bold)
                .fillColor(this.COLORS.warning)
                .text(`Gap: ₹${this.formatCurrency(action.gap_amount)}`, 100, doc.y);
        }

        // Score impact (if available)
        if (action.estimated_score_impact && action.estimated_score_impact > 0) {
            doc.fontSize(10)
                .font(this.FONTS.regular)
                .fillColor(this.COLORS.success)
                .text(` • Potential Score Impact: +${action.estimated_score_impact}`, { continued: false });
        }
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
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(amount);
    }
}
