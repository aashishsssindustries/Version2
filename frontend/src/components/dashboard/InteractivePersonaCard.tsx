import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';
import './InteractivePersonaCard.css';

interface InteractivePersonaCardProps {
    profile: any;
}

interface MetricData {
    label: string;
    actual: number;
    ideal: number;
    unit: string;
    deviation: number;
    deviationInsight: string;
}

export const InteractivePersonaCard: React.FC<InteractivePersonaCardProps> = ({ profile }) => {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    // Check for incomplete profile
    if (!profile || !profile.persona_data?.persona) {
        return (
            <div className="persona-card-container incomplete">
                <div className="incomplete-state">
                    <div className="incomplete-icon">
                        <User size={48} />
                    </div>
                    <h3>Profile Incomplete</h3>
                    <p>Complete your financial profile to discover your investor persona.</p>
                    <Link to="/profile" className="cta-primary">
                        Complete Profile <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    const { persona } = profile.persona_data;
    const monthlyIncome = profile.gross_income || 0;
    const monthlyExpenses = profile.fixed_expenses || 0;
    const monthlyEMI = profile.monthly_emi || 0;
    const emergencyFund = profile.emergency_fund_amount || profile.existing_assets || 0;

    // Calculate ratios
    const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    const debtRatio = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;
    const savingsRatio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses - monthlyEMI) / monthlyIncome) * 100 : 0;
    const investmentRatio = Math.max(0, savingsRatio * 0.7);
    const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;

    // Ideal 30-30-30-10 model with deviation insights
    const metrics: MetricData[] = useMemo(() => [
        {
            label: 'Living',
            actual: Math.round(expenseRatio),
            ideal: 30,
            unit: '%',
            deviation: Math.round(expenseRatio - 30),
            deviationInsight: expenseRatio > 35 ? 'High spending on essentials' : expenseRatio < 25 ? 'Low living costs' : 'On track'
        },
        {
            label: 'Investing',
            actual: Math.round(investmentRatio),
            ideal: 30,
            unit: '%',
            deviation: Math.round(30 - investmentRatio),
            deviationInsight: investmentRatio < 15 ? 'Low investment allocation' : investmentRatio >= 30 ? 'Strong investing habit' : 'Room to grow'
        },
        {
            label: 'Lifestyle',
            actual: Math.round(Math.max(0, 100 - expenseRatio - investmentRatio - debtRatio)),
            ideal: 30,
            unit: '%',
            deviation: Math.round(30 - Math.max(0, 100 - expenseRatio - investmentRatio - debtRatio)),
            deviationInsight: 'Discretionary spending'
        },
        {
            label: 'Debt',
            actual: Math.round(debtRatio),
            ideal: 10,
            unit: '%',
            deviation: Math.round(debtRatio - 10),
            deviationInsight: debtRatio > 40 ? 'High debt burden' : debtRatio > 20 ? 'Moderate debt' : debtRatio > 10 ? 'Acceptable debt' : 'Low debt'
        },
    ], [expenseRatio, investmentRatio, debtRatio]);

    // Find largest deviations
    const largestDeviations = useMemo(() => {
        const sorted = [...metrics]
            .map(m => ({ label: m.label, deviation: Math.abs(m.deviation) }))
            .sort((a, b) => b.deviation - a.deviation)
            .slice(0, 2)
            .filter(m => m.deviation > 5);
        return sorted.map(m => m.label).join(' & ') || 'None - well balanced!';
    }, [metrics]);

    // Radar chart calculations
    const centerX = 120;
    const centerY = 120;
    const maxRadius = 85;

    const getPointOnCircle = (index: number, value: number, max: number = 50): [number, number] => {
        const angle = (index * 90 - 90) * (Math.PI / 180);
        const radius = (Math.min(value, max) / max) * maxRadius;
        return [
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        ];
    };

    const actualPoints = metrics.map((m, i) => getPointOnCircle(i, m.actual, 50));
    const idealPoints = metrics.map((m, i) => getPointOnCircle(i, m.ideal, 50));

    const actualPath = `M ${actualPoints.map(p => p.join(',')).join(' L ')} Z`;
    const idealPath = `M ${idealPoints.map(p => p.join(',')).join(' L ')} Z`;

    const getDeviationClass = (metric: MetricData) => {
        const isDebt = metric.label === 'Debt';
        if (isDebt) {
            return metric.actual <= metric.ideal ? 'good' : metric.actual <= 20 ? 'warning' : 'danger';
        }
        return metric.actual >= metric.ideal - 5 ? 'good' : metric.actual >= metric.ideal - 15 ? 'warning' : 'danger';
    };

    const getRiskBadgeColor = (riskClass: string) => {
        switch (riskClass?.toLowerCase()) {
            case 'conservative': return 'risk-conservative';
            case 'moderate': return 'risk-moderate';
            case 'aggressive': return 'risk-aggressive';
            default: return 'risk-moderate';
        }
    };

    const activeMetric = metrics.find(m => m.label === activeTooltip);

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
            </div>

            {/* SVG Radar Chart */}
            <div className="radar-container">
                <svg viewBox="0 0 240 240" className="radar-chart">
                    {/* Background rings */}
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
                            <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} className="radar-axis" />
                        );
                    })}

                    {/* Ideal shape (Green) */}
                    <path d={idealPath} className="radar-ideal" />

                    {/* Actual shape (Blue) */}
                    <path d={actualPath} className="radar-actual" />

                    {/* Data points with hover */}
                    {metrics.map((metric, i) => {
                        const [x, y] = actualPoints[i];
                        const devClass = getDeviationClass(metric);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={8}
                                className={`radar-point ${devClass}`}
                                onMouseEnter={() => setActiveTooltip(metric.label)}
                                onMouseLeave={() => setActiveTooltip(null)}
                            />
                        );
                    })}

                    {/* Labels */}
                    {metrics.map((metric, i) => {
                        const [labelX, labelY] = getPointOnCircle(i, 62, 50);
                        return (
                            <text key={i} x={labelX} y={labelY} className="radar-label" textAnchor="middle" dominantBaseline="middle">
                                {metric.label}
                            </text>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="radar-legend">
                    <div className="legend-item">
                        <span className="legend-line ideal"></span>
                        <span>Ideal (30-30-30-10)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-line actual"></span>
                        <span>Your Profile</span>
                    </div>
                </div>

                {/* Enhanced Tooltip */}
                {activeTooltip && activeMetric && (
                    <div className="radar-tooltip enhanced">
                        <div className="tooltip-row">
                            <span className="tooltip-label">Actual:</span>
                            <span className="tooltip-value">{activeMetric.actual}{activeMetric.unit}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Ideal:</span>
                            <span className="tooltip-value">{activeMetric.ideal}{activeMetric.unit}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Deviation:</span>
                            <span className={`tooltip-value ${activeMetric.deviation > 0 ? 'negative' : 'positive'}`}>
                                {activeMetric.deviation > 0 ? '+' : ''}{activeMetric.deviation}{activeMetric.unit}
                            </span>
                        </div>
                        <div className="tooltip-insight">{activeMetric.deviationInsight}</div>
                    </div>
                )}
            </div>

            {/* Deviation Insight */}
            <div className="deviation-insight-bar">
                <span className="insight-label">Largest deviation:</span>
                <span className="insight-value">{largestDeviations}</span>
            </div>

            {/* Metric Tiles */}
            <div className="metrics-grid">
                {metrics.map((metric, i) => {
                    const devClass = getDeviationClass(metric);
                    return (
                        <div key={i} className={`metric-tile ${devClass}`}>
                            <span className="metric-label">{metric.label}</span>
                            <span className="metric-value">{metric.actual}{metric.unit}</span>
                            <span className="metric-ideal">Ideal: {metric.ideal}{metric.unit}</span>
                        </div>
                    );
                })}
            </div>

            {/* Emergency Runway */}
            <div className={`emergency-bar ${emergencyMonths >= 3 ? 'good' : emergencyMonths >= 1 ? 'warning' : 'danger'}`}>
                <div className="emergency-text">
                    <span>Emergency Runway: <strong>{emergencyMonths.toFixed(1)} months</strong></span>
                    <span className="emergency-target">(Target: 6 months)</span>
                </div>
                <div className="emergency-track">
                    <div className="emergency-fill" style={{ width: `${Math.min((emergencyMonths / 6) * 100, 100)}%` }}></div>
                </div>
            </div>

            {/* Single CTA */}
            <div className="persona-footer">
                <Link to="/profile" className="cta-secondary">
                    Update Profile <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );
};
