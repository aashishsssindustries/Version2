import { ADVISORY_REPORT_TEMPLATE } from './templates/advisoryReport.template';

export class TemplateService {
    /**
     * Generate HTML from template and data
     */
    static generateAdvisoryHTML(data: any): string {
        try {
            let html = ADVISORY_REPORT_TEMPLATE;

            // Branding
            const branding = data.branding || {};
            const companyName = branding.companyName || 'WealthMax';
            const tagline = branding.tagline || 'ADVISORY INTELLIGENCE';
            const primaryColor = branding.primaryColor || '#1a56db';

            html = html.replace(/{{COMPANY_NAME}}/g, companyName);
            html = html.replace('{{TAGLINE}}', tagline);
            html = html.replace('{{PRIMARY_COLOR}}', primaryColor);

            // 1. Cover Page
            html = html.replace('{{USER_NAME}}', data.user.name);
            html = html.replace('{{DATE}}', new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            }));

            // 2. Executive Summary
            const summary = data.snapshot.summary;
            html = html.replace('{{NET_WORTH}}', this.formatCurrency(summary.totalValue));
            html = html.replace('{{HOLDINGS_COUNT}}', summary.holdingsCount);
            html = html.replace('{{RETURNS_ABS}}', (summary.returns >= 0 ? '+' : '') + this.formatCurrency(summary.returns));
            html = html.replace('{{RETURNS_PCT}}', summary.returnsPercentage.toFixed(2));
            html = html.replace(/{{RETURN_COLOR}}/g, summary.returns >= 0 ? 'positive' : 'negative');

            const perf = data.snapshot.performance;
            html = html.replace('{{XIRR}}', perf.portfolioXIRR?.xirr ? `${perf.portfolioXIRR.xirr.toFixed(2)}%` : 'N/A');
            html = html.replace('{{BENCHMARK_XIRR}}', perf.benchmarkComparison?.benchmarkXIRR ? `${perf.benchmarkComparison.benchmarkXIRR.toFixed(2)}%` : 'N/A');

            // Insight Text (Based on benchmark comparison)
            const insightText = perf.benchmarkComparison?.explanation || "No benchmark comparison available.";
            html = html.replace('{{INSIGHT_TEXT}}', insightText);

            // 3. Asset & Category Rows
            const assetRows = data.snapshot.allocation.byAssetType.map((item: any) => `
                <tr>
                    <td>${item.type.replace('_', ' ')}</td>
                    <td>${this.formatCurrency(item.value)}</td>
                    <td>${item.percentage.toFixed(1)}%</td>
                </tr>
            `).join('');
            html = html.replace('{{ASSET_ROWS}}', assetRows);

            const categoryRows = data.snapshot.allocation.byCategory.slice(0, 5).map((item: any) => `
                <tr>
                    <td>${item.category}</td>
                    <td>${this.formatCurrency(item.value)}</td>
                    <td>${item.percentage.toFixed(1)}%</td>
                </tr>
            `).join('');
            html = html.replace('{{CATEGORY_ROWS}}', categoryRows);

            // 4. Risk Matrix Counts
            const riskMatrix = data.snapshot.risk.riskReturnMatrix;
            const counts = {
                'HighReturn-LowRisk': 0,
                'HighReturn-HighRisk': 0,
                'LowReturn-LowRisk': 0,
                'LowReturn-HighRisk': 0
            };
            riskMatrix.forEach((item: any) => {
                if (counts[item.quadrant as keyof typeof counts] !== undefined) {
                    counts[item.quadrant as keyof typeof counts]++;
                }
            });

            html = html.replace('{{Q_LR_HR}}', counts['HighReturn-LowRisk'].toString());
            html = html.replace('{{Q_HR_HR}}', counts['HighReturn-HighRisk'].toString());
            html = html.replace('{{Q_LR_LR}}', counts['LowReturn-LowRisk'].toString());
            html = html.replace('{{Q_HR_LR}}', counts['LowReturn-HighRisk'].toString());

            // 5. Risk Status
            const risk = data.snapshot.risk;
            html = html.replace('{{CONCENTRATION_STATUS}}', risk.concentrationRisk.hasRisk ? 'Attention Needed' : 'Healthy');
            html = html.replace('{{CONCENTRATION_COLOR}}', risk.concentrationRisk.hasRisk ? 'var(--danger)' : 'var(--success)');
            html = html.replace('{{CONCENTRATION_TEXT}}', risk.concentrationRisk.explanation);

            html = html.replace('{{DIVERSIFICATION_STATUS}}', risk.diversificationFlag.isOverDiversified ? 'Over-Diversified' : 'Optimal');
            html = html.replace('{{DIVERSIFICATION_COLOR}}', risk.diversificationFlag.isOverDiversified ? 'var(--warning)' : 'var(--success)');
            html = html.replace('{{DIVERSIFICATION_TEXT}}', risk.diversificationFlag.explanation);

            // 6. Top Holdings
            const topHoldings = data.snapshot.allocation.topHoldings;
            const schemes = data.snapshot.performance.schemePerformances;

            const holdingsRows = topHoldings.map((h: any) => {
                const scheme = schemes.find((s: any) => s.isin === h.isin);
                const xirr = scheme?.xirr?.xirr ? `${scheme.xirr.xirr.toFixed(1)}%` : '-';

                return `
                    <tr>
                        <td>${h.name}</td>
                        <td>${this.formatCurrency(h.value)}</td>
                        <td>${h.weight.toFixed(1)}%</td>
                        <td>${xirr}</td>
                    </tr>
                `;
            }).join('');
            html = html.replace('{{TOP_HOLDINGS}}', holdingsRows);

            // 7. Recommendations (Placeholder text or gaps)
            // Ideally this comes from Marketplace API, for now checking gaps or simplified recommendation
            let recsHtml = '';
            if (risk.concentrationRisk.hasRisk) {
                recsHtml += `
                    <div class="card" style="margin-bottom: 15px; border-left: 4px solid var(--warning);">
                        <h3 style="margin: 0 0 5px 0; font-size: 16px;">Diversify Portfolio</h3>
                        <p style="margin: 0; font-size: 14px; color: var(--secondary);">
                            Reduce exposure to concentrated positions. Consider index funds for broad market exposure.
                        </p>
                    </div>
                `;
            }
            if (!recsHtml) {
                recsHtml = `
                    <div class="card" style="border-left: 4px solid var(--success);">
                        <h3 style="margin: 0 0 5px 0; font-size: 16px;">Maintain Strategy</h3>
                        <p style="margin: 0; font-size: 14px; color: var(--secondary);">
                            Your portfolio is well-balanced. Continue your current SIPs and review quarterly.
                        </p>
                    </div>
                `;
            }
            html = html.replace('{{RECOMMENDATIONS}}', recsHtml);

            return html;
        } catch (error: any) {
            console.error('Template generation error', error);
            throw new Error('Failed to generate report HTML');
        }
    }

    private static formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    }
}
