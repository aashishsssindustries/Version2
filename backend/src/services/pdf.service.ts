import puppeteer from 'puppeteer';
import { AnalyticsService } from './analytics.service';
import { TemplateService } from './pdf/template.service';
import logger from '../config/logger';

export class PDFService {
    /**
     * Generate Advisory PDF Report using Puppeteer
     */
    static async generateAdvisoryReport(user: any, options: any = {}): Promise<Buffer> {
        let browser = null;
        try {
            // 1. Fetch comprehensive portfolio snapshot
            const snapshot = await AnalyticsService.getPortfolioSnapshot(user.id);

            // 2. Prepare data object for template
            const data = {
                user: {
                    name: user.name,
                    email: user.email
                },
                snapshot,
                branding: options.branding
            };

            // 3. Generate HTML
            const html = TemplateService.generateAdvisoryHTML(data);

            // 4. Launch Puppeteer
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

            // Set content and wait for load
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            // generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0px',
                    bottom: '0px',
                    left: '0px',
                    right: '0px'
                },
                displayHeaderFooter: false
            });

            return Buffer.from(pdfBuffer);

        } catch (error: any) {
            logger.error('PDF generation error', error);
            throw new Error('Failed to generate PDF report');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
