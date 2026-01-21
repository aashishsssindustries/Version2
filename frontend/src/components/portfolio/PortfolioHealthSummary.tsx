import React, { useEffect, useState } from 'react';
import { DollarSign, PieChart, TrendingUp, Activity } from 'lucide-react';
import { portfolioService } from '../../services/api';
import './PortfolioHealthSummary.css';

interface Holding {
    id: string;
    isin: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    quantity: number;
    current_nav?: number;
    last_valuation?: number;
}

interface PortfolioHealthSummaryProps {
    holdings: Holding[];
    totalValuation: number;
}

const PortfolioHealthSummary: React.FC<PortfolioHealthSummaryProps> = ({ holdings, totalValuation }) => {
    const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
    const [alignmentStatus, setAlignmentStatus] = useState<string>('Loading...');
    const [loadingAlignment, setLoadingAlignment] = useState(true);

    // 1. Calculate Asset Mix
    const equityValuation = holdings
        .filter(h => h.type === 'EQUITY')
        .reduce((sum, h) => sum + (h.last_valuation || 0), 0);

    const mfValuation = holdings
        .filter(h => h.type === 'MUTUAL_FUND')
        .reduce((sum, h) => sum + (h.last_valuation || 0), 0);

    const totalCalculated = equityValuation + mfValuation || 1; // Avoid div by 0
    const equityPercent = Math.round((equityValuation / totalCalculated) * 100);
    const mfPercent = Math.round((mfValuation / totalCalculated) * 100);

    // 2. Find Top Holding
    const topHolding = holdings.reduce((prev, current) => {
        return (prev.last_valuation || 0) > (current.last_valuation || 0) ? prev : current;
    }, holdings[0]);

    // 3. Fetch Alignment
    useEffect(() => {
        const fetchAlignment = async () => {
            try {
                setLoadingAlignment(true);
                const data = await portfolioService.getPortfolioAlignment();
                if (data && data.data) {
                    const score = data.data.alignmentScore;
                    setAlignmentScore(score);

                    // Simple logic map for status text if not provided
                    if (score >= 80) setAlignmentStatus('Excellent');
                    else if (score >= 60) setAlignmentStatus('Good');
                    else setAlignmentStatus('Needs Attention');
                }
            } catch (err) {
                console.error("Failed to fetch alignment for summary", err);
                setAlignmentStatus('Unavailable');
            } finally {
                setLoadingAlignment(false);
            }
        };
        fetchAlignment();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="portfolio-health-summary">
            {/* Card 1: Total Valuation */}
            <div className="health-card">
                <h3>
                    <DollarSign size={16} className="text-emerald-500" />
                    Total Valuation
                </h3>
                <div className="value">{formatCurrency(totalValuation)}</div>
                <div className="sub-value">Current Value</div>
            </div>

            {/* Card 2: Asset Mix */}
            <div className="health-card">
                <h3>
                    <PieChart size={16} className="text-blue-500" />
                    Asset Mix
                </h3>
                <div>
                    <div className="mix-legend">
                        <span className="text-blue-600 font-medium">Eq: {equityPercent}%</span>
                        <span className="text-purple-600 font-medium">MF: {mfPercent}%</span>
                    </div>
                    <div className="mix-bar">
                        <div className="mix-segment equity" style={{ width: `${equityPercent}%` }}></div>
                        <div className="mix-segment debt" style={{ width: `${mfPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Card 3: Top Holding */}
            <div className="health-card">
                <h3>
                    <TrendingUp size={16} className="text-amber-500" />
                    Top Holding
                </h3>
                {topHolding ? (
                    <>
                        <div className="value truncate text-lg" title={topHolding.name}>
                            {topHolding.name.length > 15 ? topHolding.name.substring(0, 15) + '...' : topHolding.name}
                        </div>
                        <div className="sub-value">{formatCurrency(topHolding.last_valuation || 0)}</div>
                    </>
                ) : (
                    <div className="sub-value">No holdings yet</div>
                )}
            </div>

            {/* Card 4: Alignment Status */}
            <div className="health-card alignment-card">
                <h3>
                    <Activity size={16} className={alignmentScore && alignmentScore < 60 ? "text-red-500" : "text-green-500"} />
                    Alignment Health
                </h3>
                {loadingAlignment ? (
                    <div className="loading-skeleton"></div>
                ) : (
                    <>
                        <div className="value">
                            {alignmentStatus}
                            {alignmentScore !== null && <span className="score ml-2 text-sm">({alignmentScore}/100)</span>}
                        </div>
                        <div className="sub-value">Based on Risk Profile</div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PortfolioHealthSummary;
