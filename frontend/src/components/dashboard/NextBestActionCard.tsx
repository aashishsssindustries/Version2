import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Shield, AlertTriangle, CheckCircle2,
    ChevronRight, Info, Zap, Target, DollarSign
} from 'lucide-react';
import { profileService } from '../../services/api';
import './NextBestActionCard.css';

interface NextBestAction {
    actionType: string;
    title: string;
    reason: string;
    gapAmount?: number;
    targetAmount?: number;
    currentValue?: number;
    scoreImpact: number;
    ctaText: string;
    ctaLink: string;
    progressPercent?: number;
    whyMatters?: string;
}

export const NextBestActionCard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState<NextBestAction | null>(null);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [showWhyMatters, setShowWhyMatters] = useState(false);

    useEffect(() => {
        fetchNextBestAction();
    }, []);

    const fetchNextBestAction = async () => {
        try {
            setLoading(true);
            const response = await profileService.getNextBestAction();
            setAction(response.nextAction);
            setProfileCompletion(response.profileCompletion);
        } catch (err) {
            console.error('Failed to fetch next best action', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'EMERGENCY_FUND': return <Shield className="text-blue-600" size={32} />;
            case 'INSURANCE': return <Shield className="text-indigo-600" size={32} />;
            case 'NO_SIP': return <TrendingUp className="text-green-600" size={32} />;
            case 'HIGH_DEBT': return <AlertTriangle className="text-orange-600" size={32} />;
            case 'ALL_CLEAR': return <CheckCircle2 className="text-emerald-600" size={32} />;
            default: return <Info className="text-slate-600" size={32} />;
        }
    };

    const getActionColor = (actionType: string) => {
        switch (actionType) {
            case 'EMERGENCY_FUND': return 'blue';
            case 'INSURANCE': return 'indigo';
            case 'NO_SIP': return 'green';
            case 'HIGH_DEBT': return 'orange';
            case 'ALL_CLEAR': return 'emerald';
            default: return 'slate';
        }
    };

    if (loading) {
        return (
            <div className="next-best-action-card loading">
                <div className="skeleton-header"></div>
                <div className="skeleton-body"></div>
            </div>
        );
    }

    if (!action) {
        return null;
    }

    const color = getActionColor(action.actionType);

    // Profile Incomplete State
    if (action.actionType === 'PROFILE_INCOMPLETE') {
        return (
            <div className="next-best-action-card incomplete-profile">
                <div className="card-header">
                    <div className="icon-wrapper incomplete">
                        <Info size={32} className="text-slate-600" />
                    </div>
                    <div className="header-content">
                        <h2 className="card-title">{action.title}</h2>
                        <p className="card-subtitle neutral">{action.reason}</p>
                    </div>
                </div>

                <div className="completion-bar-container">
                    <div className="completion-label">
                        <span>Profile Completion</span>
                        <span className="completion-percent">{profileCompletion}%</span>
                    </div>
                    <div className="completion-bar">
                        <div
                            className="completion-fill"
                            style={{ width: `${profileCompletion}%` }}
                        ></div>
                    </div>
                </div>

                <div className="action-footer">
                    <Link to={action.ctaLink} className="cta-button primary">
                        {action.ctaText}
                        <ChevronRight size={20} />
                    </Link>
                    {action.whyMatters && (
                        <button
                            className="why-matters-toggle"
                            onClick={() => setShowWhyMatters(!showWhyMatters)}
                        >
                            {showWhyMatters ? 'Hide details' : 'Why this matters'}
                        </button>
                    )}
                </div>

                {showWhyMatters && action.whyMatters && (
                    <div className="why-matters-panel">
                        <Info size={16} />
                        <p>{action.whyMatters}</p>
                    </div>
                )}
            </div>
        );
    }

    // Action Detected State
    return (
        <div className={`next-best-action-card ${color}`}>
            <div className="card-header">
                <div className={`icon-wrapper ${color}`}>
                    {getActionIcon(action.actionType)}
                </div>
                <div className="header-content">
                    <h2 className="card-title">{action.title}</h2>
                    <p className="card-subtitle text-slate-600">{action.reason}</p>
                </div>
            </div>

            {/* Impact Metrics */}
            <div className="impact-metrics">
                {action.gapAmount && (
                    <div className="metric-chip gap">
                        <DollarSign size={16} />
                        <div>
                            <span className="metric-label">Gap</span>
                            <span className="metric-value">₹{(action.gapAmount).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}

                {action.targetAmount && (
                    <div className="metric-chip target">
                        <Target size={16} />
                        <div>
                            <span className="metric-label">Target</span>
                            <span className="metric-value">₹{(action.targetAmount).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}

                {action.scoreImpact > 0 && (
                    <div className="metric-chip score">
                        <Zap size={16} className="fill-current" />
                        <div>
                            <span className="metric-label">Health Score Impact</span>
                            <span className="metric-value">+{action.scoreImpact} pts</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {action.progressPercent !== undefined && action.currentValue !== undefined && action.targetAmount && (
                <div className="progress-container">
                    <div className="progress-labels">
                        <span className="current-label">
                            Current: ₹{(action.currentValue).toLocaleString('en-IN')}
                        </span>
                        <span className="target-label">
                            Goal: ₹{(action.targetAmount).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${color}`}
                            style={{ width: `${Math.min(action.progressPercent, 100)}%` }}
                        ></div>
                    </div>
                    <div className="progress-percent">
                        {Math.round(action.progressPercent)}% Complete
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <div className="action-footer">
                <Link to={action.ctaLink} className={`cta-button ${color}`}>
                    {action.ctaText}
                    <ChevronRight size={20} />
                </Link>
                {action.whyMatters && (
                    <button
                        className="why-matters-toggle"
                        onClick={() => setShowWhyMatters(!showWhyMatters)}
                    >
                        {showWhyMatters ? 'Hide details' : 'Why this matters'}
                    </button>
                )}
            </div>

            {showWhyMatters && action.whyMatters && (
                <div className="why-matters-panel">
                    <Info size={16} />
                    <p>{action.whyMatters}</p>
                </div>
            )}
        </div>
    );
};
