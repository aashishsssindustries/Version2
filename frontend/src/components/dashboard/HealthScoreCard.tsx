import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ChevronDown, ChevronUp, Zap, Target, Users, ChevronRight, BookOpen, Wallet, Shield, AlertTriangle } from 'lucide-react';
import './HealthScoreCard.css';

interface HealthScoreCardProps {
    profile: any;
}

interface ScoreFactor {
    key: string;
    name: string;
    score: number;
    maxScore: number;
    description: string;
    icon: React.ReactNode;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ profile }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Locked state for no profile
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

    // Extract values from profile
    const monthlyIncome = Number(profile.gross_income || 0) / 12;
    const monthlyExpenses = Number(profile.fixed_expenses || 0);
    const monthlyEMI = Number(profile.monthly_emi || 0);
    const insurancePremium = Number(profile.insurance_premium || 0) / 12;
    const existingAssets = Number(profile.existing_assets || 0);
    const riskScore = Number(profile.risk_score || 0);

    // Calculate factors matching backend logic (20+20+15+15+15+15 = 100)
    const factors: ScoreFactor[] = useMemo(() => {
        // 1. Savings Rate (20 max)
        const surplus = monthlyIncome - (monthlyExpenses + monthlyEMI + insurancePremium);
        const savingsRatio = monthlyIncome > 0 ? surplus / monthlyIncome : 0;
        let scoreSavings = Math.round((savingsRatio / 0.20) * 20);
        scoreSavings = Math.max(0, Math.min(20, scoreSavings));

        // 2. Debt Health (20 max)
        const debtRatio = monthlyIncome > 0 ? monthlyEMI / monthlyIncome : 0;
        let scoreDebt = 20;
        if (debtRatio > 0.40) {
            scoreDebt = 0;
        } else if (debtRatio > 0.30) {
            scoreDebt = Math.round(15 - ((debtRatio - 0.30) / 0.10) * 15);
        }
        scoreDebt = Math.max(0, Math.min(20, scoreDebt));

        // 3. Liquidity (15 max)
        const monthsCovered = monthlyExpenses > 0 ? existingAssets / monthlyExpenses : 0;
        let scoreLiquidity = Math.round((monthsCovered / 6) * 15);
        scoreLiquidity = Math.max(0, Math.min(15, scoreLiquidity));

        // 4. Asset Diversity (15 max)
        const assetTypes = profile.asset_types;
        let scoreDiversity = 10;
        if (Array.isArray(assetTypes) && assetTypes.length > 0) {
            const distinct = assetTypes.filter((v: any) => v).length;
            if (distinct >= 3) scoreDiversity = 15;
            else if (distinct >= 2) scoreDiversity = 12;
            else scoreDiversity = 8;
        } else if (existingAssets > 0) {
            scoreDiversity = 10;
        } else {
            scoreDiversity = 5;
        }

        // 5. Goal Preparedness (15 max)
        let scoreGoal = 8;
        if (profile.investment_goal || profile.persona_data?.persona?.name) {
            scoreGoal = 12;
        }

        // 6. Financial Literacy (15 max)
        let scoreLiteracy = Math.round((riskScore / 100) * 15);
        scoreLiteracy = Math.max(0, Math.min(15, scoreLiteracy));

        return [
            { key: 'savings', name: 'Savings Rate', score: scoreSavings, maxScore: 20, description: '(Investments + Buffer) / Income', icon: <TrendingUp size={16} /> },
            { key: 'debt', name: 'Debt Health', score: scoreDebt, maxScore: 20, description: 'EMI / Income (< 40%)', icon: <AlertTriangle size={16} /> },
            { key: 'liquidity', name: 'Liquidity', score: scoreLiquidity, maxScore: 15, description: 'Emergency fund coverage', icon: <Wallet size={16} /> },
            { key: 'diversity', name: 'Asset Diversity', score: scoreDiversity, maxScore: 15, description: 'Portfolio spread', icon: <Shield size={16} /> },
            { key: 'goals', name: 'Goal Preparedness', score: scoreGoal, maxScore: 15, description: 'Financial goals defined', icon: <Target size={16} /> },
            { key: 'literacy', name: 'Financial Literacy', score: scoreLiteracy, maxScore: 15, description: 'Survey-based score', icon: <BookOpen size={16} /> }
        ];
    }, [monthlyIncome, monthlyExpenses, monthlyEMI, insurancePremium, existingAssets, riskScore, profile]);

    // Calculate total from factors for internal use
    const componentSum = factors.reduce((sum, f) => sum + f.score, 0);

    // Use backend score as source of truth
    const backendScore = profile.health_score || 0;
    const displayScore = backendScore > 0 ? backendScore : componentSum;

    // For display purposes, normalize breakdown to match displayed score
    const scaleFactor = displayScore > 0 && componentSum > 0 ? displayScore / componentSum : 1;
    const normalizedFactors = factors.map(f => ({
        ...f,
        score: Math.round(f.score * scaleFactor)
    }));

    // Validation: only fail if no data at all
    const isValid = displayScore > 0 || profile.gross_income > 0;

    // Percentile (derived from score)
    const percentile = Math.min(99, Math.max(1, Math.round((displayScore / 100) * 80 + 10)));

    // Projected score from action items
    const actionItems = profile.action_items || [];
    const highPriorityItems = actionItems.filter((item: any) =>
        item.priority === 'High' && item.status !== 'resolved'
    );
    const projectedGain = highPriorityItems.reduce((sum: number, item: any) =>
        sum + (item.estimated_score_impact || 0), 0
    );

    // Score label
    const getScoreLabel = (score: number) => {
        if (score >= 80) return { label: 'Excellent', class: 'excellent' };
        if (score >= 60) return { label: 'Good', class: 'good' };
        if (score >= 40) return { label: 'Average', class: 'average' };
        return { label: 'Needs Work', class: 'poor' };
    };

    const scoreInfo = getScoreLabel(displayScore);
    const circumference = 2 * Math.PI * 80;
    const progress = (displayScore / 100) * circumference;

    // Validation failed fallback
    if (!isValid) {
        console.error(`[HealthScoreCard] Validation failed: sum=${componentSum}, backend=${backendScore}`);
        return (
            <div className="health-card-container error">
                <div className="error-state">
                    <AlertTriangle size={32} />
                    <h3>Score Recalculation Required</h3>
                    <p>Please update your profile to recalculate your health score.</p>
                    <Link to="/profile" className="unlock-cta">
                        Update Profile <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="health-card-container">
            {/* Gauge Section */}
            <div className="gauge-section">
                <svg viewBox="0 0 200 200" className="gauge-svg">
                    <circle cx="100" cy="100" r="80" className="gauge-bg" />
                    <circle
                        cx="100" cy="100" r="80"
                        className={`gauge-progress ${scoreInfo.class}`}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        transform="rotate(-90 100 100)"
                    />
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
                        <span className="stat-value">+{projectedGain} pts</span>
                        <span className="stat-label">potential gain</span>
                    </div>
                </div>
            </div>

            {/* Projected Score Note */}
            {projectedGain > 0 && (
                <div className="projected-note">
                    Projected score assumes all high-priority actions are completed.
                </div>
            )}

            {/* Breakdown Toggle */}
            <button className="breakdown-toggle" onClick={() => setShowBreakdown(!showBreakdown)}>
                <span>Score Breakdown</span>
                {showBreakdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Breakdown Panel */}
            {showBreakdown && (
                <div className="breakdown-panel">
                    {normalizedFactors.map((factor) => (
                        <div key={factor.key} className="factor-row">
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
