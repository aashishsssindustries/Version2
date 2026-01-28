import { PortfolioService } from './portfolio.service';
import { computePortfolioAnalytics } from './portfolioAnalytics.service';
import { PortfolioAlignmentService } from './portfolioAlignment.service';
import { ProfileModel } from '../models/profile.model';
import { HoldingInput } from '../types/portfolioAnalytics';

export interface AnalyticsSnapshot {
    summary: {
        netWorth: number;
        investedAmount: number;
        totalPnL: number;
        absoluteReturnPercent: number;
        xirr: number;
        holdingsCount: number;
    };
    allocation: {
        equity: number;
        debt: number; // Mutual Funds treated as Debt/Hybrid for high level, or specific breakdown
        others: number;
    };
    charts: {
        assetAllocation: any; // JSON for Chart.js
        performance: any;     // JSON for Chart.js
    };
    risk: {
        score: number;
        label: string;
        flags: any[];
    };
    topHoldings: any[];
    meta: {
        userName: string;
        generatedAt: string;
    };
}

export class AnalyticsSnapshotService {
    /**
     * Get complete snapshot for a user
     */
    static async getSnapshot(userId: string): Promise<AnalyticsSnapshot> {
        // 1. Fetch Basic Data
        const profile = await ProfileModel.findByUserId(userId);
        const holdings = await PortfolioService.getHoldings(userId);

        // 2. Compute Analytics (Stateless Engine)
        // Map to HoldingInput
        const holdingInputs: HoldingInput[] = holdings.map(h => ({
            isin: h.isin,
            quantity: parseFloat(h.quantity),
            average_price: h.average_price ? parseFloat(h.average_price) : undefined,
            last_valuation: h.last_valuation ? parseFloat(h.last_valuation) : undefined,
            name: h.name,
            type: h.type as 'EQUITY' | 'MUTUAL_FUND',
            category: h.category,
            current_nav: h.current_nav ? parseFloat(h.current_nav) : undefined
        }));

        const analytics = computePortfolioAnalytics(holdingInputs);

        // 3. Compute Financials
        const netWorth = analytics.totalValue;

        // Calculate Invested Amount (if average_price is available)
        // If average_price is missing, we might assume invested = current (0 P&L) or 0.
        // For accurate P&L, we need average_price.
        let investedAmount = 0;
        holdings.forEach(h => {
            if (h.average_price && h.quantity) {
                investedAmount += parseFloat(h.quantity) * parseFloat(h.average_price);
            } else if (h.total_buy_value) { // Check if this field exists in DB model
                investedAmount += parseFloat(h.total_buy_value);
            }
        });

        // Fallback: if investedAmount is 0 but we have value, assume 0 return or mock it? 
        // Better to show 0 invested if unknown.

        const totalPnL = investedAmount > 0 ? netWorth - investedAmount : 0;
        const absoluteReturnPercent = investedAmount > 0 ? (totalPnL / investedAmount) * 100 : 0;
        const xirr = 12.5; // TODO: Implement real XIRR using TransactionService

        // 4. Alignment & Risk
        const persona = profile?.persona_data?.persona?.name || 'General';
        const alignment = await PortfolioAlignmentService.analyzeAlignment(userId, persona);

        // 5. specific Chart Data Prep
        const assetAllocationChart = {
            labels: analytics.assetAllocation.map(a => a.type),
            data: analytics.assetAllocation.map(a => a.percentage),
            colors: analytics.assetAllocation.map(a => a.type === 'EQUITY' ? '#1a237e' : '#b89c56')
        };

        const performanceChart = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Mock timeline
            portfolio: [100, 105, 103, 110, 115, 118],
            benchmark: [100, 102, 101, 104, 106, 108]
        };

        return {
            summary: {
                netWorth,
                investedAmount,
                totalPnL,
                absoluteReturnPercent,
                xirr,
                holdingsCount: holdings.length
            },
            allocation: {
                equity: analytics.assetAllocation.find(a => a.type === 'EQUITY')?.percentage || 0,
                debt: analytics.assetAllocation.find(a => a.type === 'MUTUAL_FUND')?.percentage || 0,
                others: 0
            },
            charts: {
                assetAllocation: assetAllocationChart,
                performance: performanceChart
            },
            risk: {
                score: alignment.alignmentScore,
                label: alignment.summary, // Or derive label from score
                flags: alignment.advisoryFlags
            },
            topHoldings: analytics.holdingDetails.slice(0, 10).map(h => ({
                name: h.name,
                type: h.type,
                value: h.currentValue,
                percent: h.percentage
            })),
            meta: {
                // Profile model doesn't store name strictly, it's in users table. 
                // We could fetch user via UserService or just use a fallback for now to avoid circular dependency complex.
                // Or better, since we don't have UserService imported here easily without check, use generic.
                userName: 'Valued Client',
                generatedAt: new Date().toISOString()
            }
        };
    }
}
