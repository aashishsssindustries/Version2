import React, { useEffect, useState } from 'react';
import { portfolioService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, TrendingUp, Info } from 'lucide-react';
import PersonaAllocationChart from './PersonaAllocationChart'; // Assuming same directory or adjust import
import './PortfolioHealthWidget.css'; // Will create this

interface PortfolioHealthWidgetProps {
    className?: string; // Standard prop for styling
}

const PortfolioHealthWidget: React.FC<PortfolioHealthWidgetProps> = ({ className }) => {
    const [loading, setLoading] = useState(true);
    const [alignmentData, setAlignmentData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAlignmentData();
    }, []);

    const fetchAlignmentData = async () => {
        try {
            setLoading(true);
            const data = await portfolioService.getPortfolioAlignment();

            // The API interceptor unwraps the response if success is true.
            // So if we get the data object directly, it's a success.
            // We check for a known property to verify.
            if (data && data.alignmentScore !== undefined) {
                setAlignmentData(data);
            } else {
                // If success was false, the interceptor returns the original response body
                setError('Failed to load portfolio health data');
            }
        } catch (err) {
            console.error(err);
            setError('Unable to fetch portfolio alignment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={`portfolio-health-widget loading ${className || ''}`}>
                <CardContent>
                    <div className="skeleton-pulse" style={{ height: '300px', background: '#f5f5f5', borderRadius: '8px' }}></div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`portfolio-health-widget error ${className || ''}`}>
                <CardContent>
                    <div className="error-state">
                        <AlertCircle className="text-red-500 mb-2" />
                        <p>{error}</p>
                        <button onClick={fetchAlignmentData} className="retry-btn">Retry</button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!alignmentData || !alignmentData.actualAllocation) {
        return null; // Or empty state
    }

    const { alignmentScore, actualAllocation, advisoryFlags, persona } = alignmentData;

    // Map backend actual allocation to chart format (Needs/Wants/Savings/Protection)
    // Backend returns equity/mutualFund split, but the 30-30-30-10 rule is budget-based.
    // For portfolio visualization, we might map Asset Classes to these buckets roughly or just show the Ideal comparison.
    // Wait, the prompt implies visualizing the user's PORTFOLIO alignment against the Persona.
    // The PersonaAllocationChart is 30-30-30-10 (Budget). 
    // Portfolio is Equity/Debt. 
    // Let's adapt: The user likely wants to see the "Alignment Score" and the relevant flags.
    // For the chart, if we strictly want 30-30-30-10, we need expense data. 
    // IF the backend alignment service returns portfolio-specific allocation (Equity/MF), we should visualize THAT.
    // BUT the requirement says "PersonaAllocationChart (30-30-30-10 donut)".
    // Let's stick to the requirement: Use PersonaAllocationChart mainly for the "Ideal" visualization 
    // and maybe overlay actual if we can map it, otherwise just show score stats.

    // Actually, looking at previous logs, PersonaAllocationChart was designed for 30-30-30-10. 
    // PortfolioAlignmentService returns Equity/MF split.
    // Discrepancy: Portfolio Alignment (Assets) != Budget Allocation (Income).
    // Strategy: We will display the Portfolio Alignment Score prominently.
    // We will ALSO display the Persona Chart as a "Target Reference" for their financial life.
    // For the "Actual" prop of PersonaAllocationChart, we can't map Equity/MF directly to Needs/Wants.
    // We will show the chart in "interactive" mode to educate.
    // For Portfolio Alignment, we'll use a linear progress bar or similar for Equity vs Debt.

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-500';
    };

    return (
        <Card className={`portfolio-health-widget ${className || ''}`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg font-semibold cursor-default">
                    <span>Portfolio Alignment</span>
                    <span className={`text-2xl font-bold ${getScoreColor(alignmentScore)}`}>
                        {alignmentScore}/100
                    </span>
                </CardTitle>
                <p className="text-xs text-gray-500">Benchmark: {persona}</p>
            </CardHeader>

            <CardContent>
                <div className="widget-grid">
                    {/* Left: Visualization */}
                    <div className="chart-section flex flex-col items-center justify-center p-4">
                        {/* We use the chart to show the IDEAL breakdown for this persona type roughly, 
                            or just as a financial concept visualizer if we lack expense data */}
                        <div className="mb-4">
                            <PersonaAllocationChart size={180} interactive />
                        </div>
                        <p className="text-xs text-center text-gray-400 max-w-[200px]">
                            *Chart represents ideal 30-30-30-10 budget rule for your persona.
                        </p>
                    </div>

                    {/* Right: Stats & Flags */}
                    <div className="stats-section">
                        {/* Actual vs Ideal (Portfolio Specific) */}
                        <div className="allocation-bars mb-6">
                            <h4 className="text-sm font-medium mb-2 text-gray-700">Asset Allocation</h4>

                            {/* Equity */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Equity</span>
                                    <span className="text-gray-500">Target: {alignmentData.idealAllocation.equity}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(actualAllocation.equity, 100)}%` }}
                                    />
                                </div>
                                <div className="text-right text-xs mt-0.5 font-medium">{actualAllocation.equity.toFixed(1)}%</div>
                            </div>

                            {/* Mutual Funds / Debt */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Mutual Funds / Debt</span>
                                    <span className="text-gray-500">Target: {alignmentData.idealAllocation.mutualFund}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(actualAllocation.mutualFund, 100)}%` }}
                                    />
                                </div>
                                <div className="text-right text-xs mt-0.5 font-medium">{actualAllocation.mutualFund.toFixed(1)}%</div>
                            </div>
                        </div>

                        {/* Advisory Flags */}
                        <div className="advisory-flags flex flex-col gap-2">
                            {advisoryFlags.length === 0 && (
                                <div className="p-3 bg-green-50 rounded border border-green-100 flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                    <p className="text-xs text-green-800">Your portfolio is perfectly aligned with your profile!</p>
                                </div>
                            )}

                            {advisoryFlags.map((flag: any) => (
                                <div
                                    key={flag.id}
                                    className={`p-3 rounded border flex items-start gap-2 ${flag.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                                        flag.type === 'suggestion' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                                        }`}
                                >
                                    {flag.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /> :
                                        flag.type === 'suggestion' ? <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /> :
                                            <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />}
                                    <div className="flag-content">
                                        <p className={`text-xs font-semibold mb-0.5 ${flag.type === 'warning' ? 'text-amber-800' :
                                            flag.type === 'suggestion' ? 'text-blue-800' : 'text-gray-700'
                                            }`}>
                                            {flag.title}
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {flag.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PortfolioHealthWidget;
