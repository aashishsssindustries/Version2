import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FinancialHealthCard.css';

interface FinancialHealthCardProps {
    profile: any;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ profile }) => {
    const navigate = useNavigate();

    if (!profile) return null;

    const score = profile.health_score || 0;
    const category = profile.health_category || 'Average';
    const isUnlocked = !!profile.risk_class;

    if (!isUnlocked) {
        return (
            <div className="health-card locked">
                <div className="lock-overlay">
                    <div className="lock-icon">🔒</div>
                    <h3>Financial Health Score</h3>
                    <p>Complete your Risk Assessment to unlock your detailed score</p>
                    <button className="btn btn-primary" onClick={() => navigate('/risk-assessment')}>
                        Unlock Score
                    </button>
                </div>
            </div>
        );
    }

    // Determine score color
    let scoreClass = 'score-low';
    if (score > 66) scoreClass = 'score-high';
    else if (score > 33) scoreClass = 'score-medium';

    const ratios = profile.metrics?.ratios || {};

    return (
        <div className="health-card">
            <div className="health-header">
                <h3>Financial Health Score</h3>
                <span className={`category-badge ${scoreClass}`}>{category}</span>
            </div>

            <div className="score-container">
                <div className="score-circle">
                    <svg className="score-ring" width="150" height="150">
                        <circle cx="75" cy="75" r="60" className="score-bg" />
                        <circle
                            cx="75"
                            cy="75"
                            r="60"
                            className={`score-progress ${scoreClass}`}
                            style={{
                                strokeDasharray: `${(score / 100) * 377} 377`
                            }}
                        />
                    </svg>
                    <div className="score-value">
                        <span className="score-number">{score}</span>
                        <span className="score-max">/100</span>
                    </div>
                </div>
            </div>

            <div className="health-breakdown">
                <h4>Breakdown</h4>
                <div className="breakdown-grid">
                    <div className="breakdown-item">
                        <span className="breakdown-label">Savings Ratio</span>
                        <div className="breakdown-bar">
                            <div
                                className="breakdown-fill savings"
                                style={{ width: `${Math.min((ratios.investments || 0), 100)}%` }}
                            />
                        </div>
                        <span className="breakdown-value">{Math.round(ratios.investments || 0)}%</span>
                    </div>

                    <div className="breakdown-item">
                        <span className="breakdown-label">Debt Ratio</span>
                        <div className="breakdown-bar">
                            <div
                                className="breakdown-fill debt"
                                style={{ width: `${Math.min((ratios.liabilities || 0), 100)}%` }}
                            />
                        </div>
                        <span className="breakdown-value">{Math.round(ratios.liabilities || 0)}%</span>
                    </div>

                    <div className="breakdown-item">
                        <span className="breakdown-label">Liquidity</span>
                        <div className="breakdown-bar">
                            <div
                                className="breakdown-fill liquidity"
                                style={{ width: `${Math.min((ratios.emergency_fund || 0) * 10, 100)}%` }}
                            />
                        </div>
                        <span className="breakdown-value">{(ratios.emergency_fund || 0).toFixed(1)}x</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
