import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, ChevronRight, Info, RefreshCw } from 'lucide-react';
import './InteractivePersonaCard.css';

interface InteractivePersonaCardProps {
    profile: any;
}

interface MetricData {
    label: string;
    actual: number;
    ideal: number;
    unit: string;
    tooltip: string;
}

export const InteractivePersonaCard: React.FC<InteractivePersonaCardProps> = ({ profile }) => {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Check for incomplete profile
    if (!profile || !profile.persona_data?.persona) {
        return (
            <div className="persona-card-container incomplete">
                <div className="incomplete-state">
                    <div className="incomplete-icon">
                        <User size={48} />
                    </div>
                    <h3>Profile Incomplete</h3>
                    <p>Complete your financial profile to discover your investor persona and get personalized insights.</p>
                    <Link to="/profile" className="cta-primary">
                        Complete Profile <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    const { persona, behavior } = profile.persona_data;
    const monthlyIncome = profile.gross_income || 0;
    const monthlyExpenses = profile.fixed_expenses || 0;
    const monthlyEMI = profile.monthly_emi || 0;
    const emergencyFund = profile.emergency_fund_amount || 0;

    // Calculate ratios
    const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    const debtRatio = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;
    const savingsRatio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses - monthlyEMI) / monthlyIncome) * 100 : 0;
    const investmentRatio = monthlyIncome > 0 ? Math.max(0, savingsRatio * 0.7) : 0; // Assume 70% of savings invested
    const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;

    // Ideal 30-30-30-10 model
    const metrics: MetricData[] = [
        {
            label: 'Living',
            actual: expenseRatio,
            ideal: 30,
            unit: '%',
            tooltip: 'Monthly expenses as percentage of income. Ideal: 30% or less.'
        },
        {
            label: 'Investing',
            actual: investmentRatio,
            ideal: 30,
            unit: '%',
            tooltip: 'Amount invested monthly. Ideal: 30% of income for wealth building.'
        },
        {
            label: 'Lifestyle',
            actual: Math.max(0, 100 - expenseRatio - investmentRatio - debtRatio),
            ideal: 30,
            unit: '%',
            tooltip: 'Discretionary spending. Ideal: 30% for quality of life.'
        },
        {
            label: 'Debt',
            actual: debtRatio,
            ideal: 10,
            unit: '%',
            tooltip: 'EMI and loan payments. Ideal: Under 10% for financial freedom.'
        },
    ];

    // Calculate radar chart points
    const centerX = 120;
    const centerY = 120;
    const maxRadius = 90;

    const getPointOnCircle = (index: number, value: number, max: number = 50): [number, number] => {
        const angle = (index * 90 - 90) * (Math.PI / 180); // Start from top, go clockwise
        const radius = (value / max) * maxRadius;
        return [
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        ];
    };

    const actualPoints = metrics.map((m, i) => getPointOnCircle(i, Math.min(m.actual, 50), 50));
    const idealPoints = metrics.map((m, i) => getPointOnCircle(i, m.ideal, 50));

    const actualPath = `M ${actualPoints.map(p => p.join(',')).join(' L ')} Z`;
    const idealPath = `M ${idealPoints.map(p => p.join(',')).join(' L ')} Z`;

    const getDeviationColor = (actual: number, ideal: number, isDebt: boolean = false) => {
        const diff = isDebt ? actual - ideal : ideal - actual;
        if (diff <= 5) return 'deviation-good';
        if (diff <= 15) return 'deviation-warning';
        return 'deviation-danger';
    };

    const getRiskBadgeColor = (riskClass: string) => {
        switch (riskClass?.toLowerCase()) {
            case 'conservative': return 'risk-conservative';
            case 'moderate': return 'risk-moderate';
            case 'aggressive': return 'risk-aggressive';
            default: return 'risk-moderate';
        }
    };

    return (
        <div className="persona-card-container">
            {/* Header */}
            <div className="persona-header">
                <div className="persona-identity">
                    <div className="persona-avatar">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="persona-name">{persona.name || 'Financial Persona'}</h3>
                        <span className={`risk-badge ${getRiskBadgeColor(profile.risk_class || persona.risk_appetite)}`}>
                            {profile.risk_class || persona.risk_appetite || 'Unassessed'}
                        </span>
                    </div>
                </div>
                <button
                    className="info-toggle"
                    onClick={() => setShowDetails(!showDetails)}
                    title="Why this profile?"
                >
                    <Info size={18} />
                </button>
            </div>

            {/* SVG Radar Chart */}
            <div className="radar-container">
                <svg viewBox="0 0 240 240" className="radar-chart">
                    {/* Background circles */}
                    {[25, 50, 75, 100].map((pct, i) => (
                        <circle
                            key={i}
                            cx={centerX}
                            cy={centerY}
                            r={(pct / 100) * maxRadius}
                            className="radar-ring"
                        />
                    ))}

                    {/* Axis lines */}
                    {metrics.map((_, i) => {
                        const [x, y] = getPointOnCircle(i, 50, 50);
                        return (
                            <line
                                key={i}
                                x1={centerX}
                                y1={centerY}
                                x2={x}
                                y2={y}
                                className="radar-axis"
                            />
                        );
                    })}

                    {/* Ideal shape */}
                    <path d={idealPath} className="radar-ideal" />

                    {/* Actual shape */}
                    <path d={actualPath} className="radar-actual" />

                    {/* Data points */}
                    {metrics.map((metric, i) => {
                        const [x, y] = actualPoints[i];
                        const isDebt = metric.label === 'Debt';
                        const devClass = getDeviationColor(metric.actual, metric.ideal, isDebt);

                        return (
                            <g key={i}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={8}
                                    className={`radar-point ${devClass}`}
                                    onMouseEnter={() => setActiveTooltip(metric.label)}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                />
                            </g>
                        );
                    })}

                    {/* Labels */}
                    {metrics.map((metric, i) => {
                        const [labelX, labelY] = getPointOnCircle(i, 60, 50);
                        return (
                            <text
                                key={i}
                                x={labelX}
                                y={labelY}
                                className="radar-label"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {metric.label}
                            </text>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="radar-legend">
                    <div className="legend-item">
                        <span className="legend-dot ideal"></span>
                        <span>Ideal (30-30-30-10)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot actual"></span>
                        <span>Your Profile</span>
                    </div>
                </div>

                {/* Floating Tooltip */}
                {activeTooltip && (
                    <div className="radar-tooltip">
                        {metrics.find(m => m.label === activeTooltip)?.tooltip}
                    </div>
                )}
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                {metrics.map((metric, i) => {
                    const isDebt = metric.label === 'Debt';
                    const devClass = getDeviationColor(metric.actual, metric.ideal, isDebt);

                    return (
                        <div key={i} className={`metric-tile ${devClass}`}>
                            <span className="metric-label">{metric.label}</span>
                            <span className="metric-value">
                                {metric.actual.toFixed(0)}{metric.unit}
                            </span>
                            <span className="metric-ideal">
                                Ideal: {metric.ideal}{metric.unit}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Emergency Fund Indicator */}
            <div className={`emergency-indicator ${emergencyMonths >= 3 ? 'good' : emergencyMonths >= 1 ? 'warning' : 'danger'}`}>
                <div className="emergency-info">
                    <span className="emergency-label">Emergency Runway</span>
                    <span className="emergency-value">{emergencyMonths.toFixed(1)} months</span>
                </div>
                <div className="emergency-bar">
                    <div
                        className="emergency-fill"
                        style={{ width: `${Math.min((emergencyMonths / 6) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Details Panel */}
            {showDetails && (
                <div className="details-panel">
                    <h4>Why This Profile?</h4>
                    <p>{persona.description || behavior?.description || 'Based on your income, expenses, and risk assessment, we\'ve identified your unique financial behavior pattern.'}</p>
                    <div className="details-actions">
                        <Link to="/risk-assessment" className="details-link">
                            <RefreshCw size={14} /> Retake Assessment
                        </Link>
                        <Link to="/profile" className="details-link">
                            <User size={14} /> Update Profile
                        </Link>
                    </div>
                </div>
            )}

            {/* Footer CTA */}
            <div className="persona-footer">
                <Link to="/profile" className="cta-secondary">
                    Update Profile <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );
};
