import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ChevronDown, ChevronUp, Zap, Target, Users, ChevronRight } from 'lucide-react';
import './HealthScoreCard.css';

interface HealthScoreCardProps {
    profile: any;
}

interface ScoreFactor {
    name: string;
    score: number;
    maxScore: number;
    description: string;
    icon: React.ReactNode;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ profile }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);

    if (!profile) {
        return (
            <div className="health-card-container locked">
                <div className="locked-state">
                    <div className="locked-gauge">
                        <svg viewBox="0 0 200 200" className="gauge-svg">
                            <circle cx="100" cy="100" r="80" className="gauge-bg" />
                            <text x="100" y="100" className="gauge-locked-text">?</text>
                            <text x="100" y="130" className="gauge-locked-label">Locked</text>
                        </svg>
                    </div>
                    <h3>Financial Health Score</h3>
                    <p>Complete your profile to unlock your personalized health score</p>
                    <Link to="/profile" className="unlock-cta">
                        Unlock Score <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    const healthScore = profile.health_score || 0;
    const metrics = profile.metrics || {};

    // Calculate individual factor scores (simulated breakdown)
    const savingsRate = metrics.ratios?.investments || 0;
    const debtRatio = metrics.ratios?.emi || 0;
    const liquidityMonths = profile.emergency_fund_amount && profile.fixed_expenses
        ? profile.emergency_fund_amount / profile.fixed_expenses
        : 0;

    const factors: ScoreFactor[] = [
        {
            name: 'Savings Rate',
            score: Math.min(Math.round(savingsRate * 1.5), 20),
            maxScore: 20,
            description: 'Monthly savings as % of income',
            icon: <TrendingUp size={16} />
        },
        {
            name: 'Debt Health',
            score: Math.round(Math.max(0, 20 - (debtRatio * 0.5))),
            maxScore: 20,
            description: 'EMI burden relative to income',
            icon: <Target size={16} />
        },
        {
            name: 'Emergency Buffer',
            score: Math.min(Math.round(liquidityMonths * 5), 20),
            maxScore: 20,
            description: 'Months of expenses covered',
            icon: <Zap size={16} />
        },
        {
            name: 'Asset Diversity',
            score: profile.asset_types?.length ? Math.min(profile.asset_types.length * 5, 20) : 5,
            maxScore: 20,
            description: 'Variety of investment types',
            icon: <Users size={16} />
        },
        {
            name: 'Goal Preparedness',
            score: profile.investment_goal ? 15 : 5,
            maxScore: 20,
            description: 'Financial goals defined',
            icon: <Target size={16} />
        }
    ];

    const totalFactorScore = factors.reduce((sum, f) => sum + f.score, 0);
    const displayScore = healthScore > 0 ? healthScore : totalFactorScore;

    // Calculate percentile (simulated cohort comparison)
    const percentile = profile.percentile || Math.min(Math.round((displayScore / 100) * 85 + 10), 95);

    // Projected score improvement
    const projectedImprovement = profile.action_items?.length
        ? profile.action_items.slice(0, 3).reduce((sum: number, item: any) => sum + (item.estimated_score_impact || 0), 0)
        : 12;

    const getScoreLabel = (score: number) => {
        if (score >= 80) return { label: 'Excellent', class: 'excellent' };
        if (score >= 60) return { label: 'Good', class: 'good' };
        if (score >= 40) return { label: 'Average', class: 'average' };
        return { label: 'Needs Work', class: 'poor' };
    };

    const scoreInfo = getScoreLabel(displayScore);
    const circumference = 2 * Math.PI * 80;
    const progress = (displayScore / 100) * circumference;

    return (
        <div className="health-card-container">
            {/* Gauge Section */}
            <div className="gauge-section">
                <svg viewBox="0 0 200 200" className="gauge-svg">
                    {/* Background circle */}
                    <circle cx="100" cy="100" r="80" className="gauge-bg" />

                    {/* Progress arc */}
                    <circle
                        cx="100"
                        cy="100"
                        r="80"
                        className={`gauge-progress ${scoreInfo.class}`}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        transform="rotate(-90 100 100)"
                    />

                    {/* Score text */}
                    <text x="100" y="90" className="gauge-score">{displayScore}</text>
                    <text x="100" y="115" className="gauge-max">/100</text>
                    <text x="100" y="140" className={`gauge-label ${scoreInfo.class}`}>{scoreInfo.label}</text>
                </svg>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-chip percentile">
                    <Users size={14} />
                    <div>
                        <span className="stat-value">Top {100 - percentile}%</span>
                        <span className="stat-label">vs similar users</span>
                    </div>
                </div>
                <div className="stat-chip projected">
                    <Zap size={14} />
                    <div>
                        <span className="stat-value">+{projectedImprovement} pts</span>
                        <span className="stat-label">if actions taken</span>
                    </div>
                </div>
            </div>

            {/* Breakdown Toggle */}
            <button
                className="breakdown-toggle"
                onClick={() => setShowBreakdown(!showBreakdown)}
            >
                <span>Score Breakdown</span>
                {showBreakdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Breakdown Accordion */}
            {showBreakdown && (
                <div className="breakdown-panel">
                    {factors.map((factor, i) => (
                        <div key={i} className="factor-row">
                            <div className="factor-info">
                                <div className="factor-icon">{factor.icon}</div>
                                <div>
                                    <span className="factor-name">{factor.name}</span>
                                    <span className="factor-desc">{factor.description}</span>
                                </div>
                            </div>
                            <div className="factor-score">
                                <div className="factor-bar">
                                    <div
                                        className="factor-fill"
                                        style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="factor-value">{factor.score}/{factor.maxScore}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CTA */}
            <div className="health-footer">
                <Link to="/calculators" className="improvement-cta">
                    View Improvement Plan <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );
};
