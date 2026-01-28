
import { chromium, Browser } from 'playwright';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

interface ReportData {
    userName: string;
    reportDate: string;
    reportId: string;
    totalValuation: string;
    xirr: number;
    riskScore: number;
    allocationDataJson: string; // JSON string for Chart.js
    performanceDataJson: string; // JSON string for Chart.js
    holdings: Array<{
        name: string;
        type: string;
        typeColor: string;
        quantity: string;
        value: string;
        percent: string;
    }>;
    recommendationText: string;
}

export class ReportService {
    private static browser: Browser | null = null;

    /**
     * Initialize Playwright Browser (Singleton)
     * For high-throughput output, you might want to restart this periodically
     */
    static async initBrowser() {
        if (!this.browser) {
            logger.info('Launching Playwright browser...');
            this.browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Crucial for some container envs
            });
        }
        return this.browser;
    }

    /**
     * Generate PDF Report
     */
    static async generateAdvisoryReport(data: ReportData): Promise<Buffer> {
        const browser = await this.initBrowser();
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Load template
            const templatePath = path.join(__dirname, '../templates/report_template.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf-8');

            // Quick & Dirty Template Replacement (Replace with Handlebars if logic gets complex)
            // Note: We are replacing simple {{key}} placeholders manually for speed/simplicity
            // For loops like {{#holdings}}, we'll construct the HTML string first

            // 1. Array loop for Holdings
            const holdingsHtml = data.holdings.map(h => `
                <tr>
                    <td>${h.name}</td>
                    <td><span style="font-size:9px; padding:2px 4px; border-radius:3px; background:${h.typeColor}; color:white">${h.type}</span></td>
                    <td style="text-align:right">${h.quantity}</td>
                    <td style="text-align:right">${h.value}</td>
                    <td style="text-align:right">${h.percent}%</td>
                </tr>
            `).join('');

            // Replace Sections
            // We use a regex to replace the block {{#holdings}}...{{/holdings}}
            htmlContent = htmlContent.replace(/{{#holdings}}[\s\S]*?{{\/holdings}}/, holdingsHtml);

            // 2. Simple Replacements
            // Order matters: longer keys first if they overlap (rare here)
            htmlContent = htmlContent
                .replace(/{{userName}}/g, data.userName)
                .replace(/{{reportDate}}/g, data.reportDate)
                .replace(/{{reportId}}/g, data.reportId)
                .replace(/{{totalValuation}}/g, data.totalValuation)
                .replace(/{{xirr}}/g, data.xirr.toString())
                .replace(/{{riskScore}}/g, data.riskScore.toString())
                .replace(/{{allocationDataJson}}/g, data.allocationDataJson)
                .replace(/{{performanceDataJson}}/g, data.performanceDataJson)
                .replace(/{{recommendationText}}/g, data.recommendationText);

            // Set content
            await page.setContent(htmlContent, { waitUntil: 'networkidle' });

            // Wait for Chart.js animation (or our explicit signal)
            // Chart.js defaults to ~1s animation. We added a dummy element '#render-complete' 
            // but for safety in this rough impl, we also wait a moment or verify chart existence.
            // Actually, networkidle usually waits enough for CDN scripts.
            // Let's verify the canvas has drawn something or wait for our div.
            // Since we didn't add the div logic in valid Chart.js callback, let's just wait a safe buffer
            // or use specific playwright locator.
            await page.waitForTimeout(1000); // 1s buffer for Chart.js animation

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: 0, bottom: 0, left: 0, right: 0 } // CSS handles margins
            });

            return pdfBuffer;

        } catch (err) {
            logger.error('PDF Generation Failed', err);
            throw err;
        } finally {
            await page.close();
        }
    }
}
