export const ADVISORY_REPORT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WealthMax Advisory Report</title>
    <style>
        :root {
            --primary: {{PRIMARY_COLOR}};
            --secondary: #6b7280;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --text: #1f2937;
            --light-bg: #f9fafb;
            --border: #e5e7eb;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: var(--text);
            line-height: 1.5;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
        }

        .page {
            padding: 40px;
            position: relative;
            background: white;
            page-break-after: always;
            min-height: 1056px; /* A4 height at 96dpi approx */
        }

        .page:last-child {
            page-break-after: auto;
        }

        /* Cover Page */
        .cover-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 900px;
            text-align: center;
        }

        .logo {
            font-size: 48px;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 20px;
        }

        .report-title {
            font-size: 36px;
            font-weight: bold;
            color: var(--text);
            margin-top: 60px;
            margin-bottom: 20px;
        }

        .client-name {
            font-size: 24px;
            color: var(--secondary);
            margin-bottom: 40px;
        }

        .date-badge {
            background: var(--light-bg);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            color: var(--secondary);
        }

        /* Headings */
        h1 {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
            padding-bottom: 10px;
            margin-bottom: 30px;
            font-size: 24px;
        }

        h2 {
            font-size: 18px;
            color: var(--text);
            margin-bottom: 15px;
            font-weight: bold;
        }

        /* Grid Layouts */
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        /* Cards */
        .card {
            background: var(--light-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
        }

        .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: var(--text);
            margin: 10px 0;
        }

        .metric-label {
            font-size: 14px;
            color: var(--secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .positive { color: var(--success); }
        .negative { color: var(--danger); }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            text-align: left;
            padding: 12px;
            background: var(--light-bg);
            border-bottom: 2px solid var(--border);
            font-size: 12px;
            text-transform: uppercase;
            color: var(--secondary);
        }

        td {
            padding: 12px;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
        }

        /* Risk Matrix Visualization */
        .risk-matrix {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            height: 300px;
        }

        .quadrant {
            border: 1px dashed var(--secondary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(249, 250, 251, 0.5);
            padding: 10px;
            text-align: center;
        }

        .quadrant-title {
            font-size: 12px;
            color: var(--secondary);
            margin-bottom: 5px;
        }

        .quadrant-count {
            font-size: 24px;
            font-weight: bold;
        }

        /* Disclaimer */
        .footer {
            margin-top: 50px;
            font-size: 10px;
            color: var(--secondary);
            border-top: 1px solid var(--border);
            padding-top: 20px;
            text-align: justify;
        }
    </style>
</head>
<body>

    <!-- Cover Page -->
    <div class="page cover-page">
        <div class="logo">{{COMPANY_NAME}}</div>
        <div style="font-size: 16px; color: var(--secondary); letter-spacing: 2px;">{{TAGLINE}}</div>
        
        <div class="report-title">Portfolio Strategy Report</div>
        <div class="client-name">Prepared for {{USER_NAME}}</div>
        
        <div class="date-badge">{{DATE}}</div>

        <div style="position: absolute; bottom: 50px; font-size: 12px; color: var(--secondary);">
            Strictly Private & Confidential
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="page">
        <h1>Executive Summary</h1>
        
        <div class="grid-3">
            <div class="card">
                <div class="metric-label">Net Worth</div>
                <div class="metric-value">{{NET_WORTH}}</div>
                <div style="font-size: 12px; color: var(--secondary);">Across {{HOLDINGS_COUNT}} holdings</div>
            </div>
            <div class="card">
                <div class="metric-label">Absolute Return</div>
                <div class="metric-value {{RETURN_COLOR}}">{{RETURNS_ABS}}</div>
                <div style="font-size: 12px;" class="{{RETURN_COLOR}}">{{RETURNS_PCT}}%</div>
            </div>
            <div class="card">
                <div class="metric-label">Portfolio XIRR</div>
                <div class="metric-value">{{XIRR}}</div>
                <div style="font-size: 12px; color: var(--secondary);">vs {{BENCHMARK_XIRR}} Benchmark</div>
            </div>
        </div>

        <h2>Portfolio Insight</h2>
        <div class="card" style="margin-bottom: 30px; border-left: 4px solid var(--primary);">
            <p style="margin: 0; font-size: 14px;">
                {{INSIGHT_TEXT}}
            </p>
        </div>

        <h2>Asset Allocation</h2>
        <div class="grid-2">
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Asset Class</th>
                            <th>Value</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{ASSET_ROWS}}
                    </tbody>
                </table>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Value</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{CATEGORY_ROWS}}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Performance & Risk -->
    <div class="page">
        <h1>Risk & Performance Analytics</h1>

        <div class="grid-2">
            <div>
                <h2>Risk-Return Profile</h2>
                <div class="risk-matrix">
                    <div class="quadrant">
                        <div class="quadrant-title">Low Risk / High Return</div>
                        <div class="quadrant-count" style="color: var(--success);">{{Q_LR_HR}}</div>
                    </div>
                    <div class="quadrant">
                        <div class="quadrant-title">High Risk / High Return</div>
                        <div class="quadrant-count" style="color: var(--warning);">{{Q_HR_HR}}</div>
                    </div>
                    <div class="quadrant">
                        <div class="quadrant-title">Low Risk / Low Return</div>
                        <div class="quadrant-count" style="color: var(--primary);">{{Q_LR_LR}}</div>
                    </div>
                    <div class="quadrant">
                        <div class="quadrant-title">High Risk / Low Return</div>
                        <div class="quadrant-count" style="color: var(--danger);">{{Q_HR_LR}}</div>
                    </div>
                </div>
            </div>
            
            <div>
                <h2>Concentration Risk Analysis</h2>
                <div class="card" style="margin-bottom: 20px;">
                    <div class="metric-label">Status</div>
                    <div class="metric-value" style="font-size: 20px; color: {{CONCENTRATION_COLOR}}">
                        {{CONCENTRATION_STATUS}}
                    </div>
                    <p style="font-size: 13px; color: var(--secondary); margin-bottom: 0;">
                        {{CONCENTRATION_TEXT}}
                    </p>
                </div>

                <h2>Diversification Health</h2>
                <div class="card">
                    <div class="metric-label">Status</div>
                    <div class="metric-value" style="font-size: 20px; color: {{DIVERSIFICATION_COLOR}}">
                        {{DIVERSIFICATION_STATUS}}
                    </div>
                     <p style="font-size: 13px; color: var(--secondary); margin-bottom: 0;">
                        {{DIVERSIFICATION_TEXT}}
                    </p>
                </div>
            </div>
        </div>

        <h2>Top Holdings</h2>
        <table>
            <thead>
                <tr>
                    <th>Scheme Name</th>
                    <th>Value</th>
                    <th>Weight</th>
                    <th>XIRR</th>
                </tr>
            </thead>
            <tbody>
                {{TOP_HOLDINGS}}
            </tbody>
        </table>
    </div>

    <!-- Recommendations & Footer -->
    <div class="page">
        <h1>Strategic Recommendations</h1>
        
        <div style="margin-bottom: 40px;">
            {{RECOMMENDATIONS}}
        </div>

        <div class="footer">
            <p><strong>Disclaimer:</strong> This report is generated by {{COMPANY_NAME}} for educational purposes only. It assumes standard market conditions and does not constitute financial advice. Past performance is not indicative of future results.</p>
            <p>Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing.</p>
            <p>© 2026 {{COMPANY_NAME}}. All rights reserved.</p>
        </div>
    </div>

</body>
</html>
`;
