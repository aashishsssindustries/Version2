import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle, ChevronRight, Zap, Clock, CheckCircle2,
    Shield, TrendingUp, Wallet, Target, PlayCircle
} from 'lucide-react';
import './ActionItemsGrid.css';

interface ActionItem {
    id?: string;
    title: string;
    description?: string;
    category?: string;
    priority: 'High' | 'Medium' | 'Low';
    gap_amount?: number;
    estimated_score_impact?: number;
    action?: string;
    linked_tool?: string;
    status?: 'pending' | 'in_progress' | 'resolved';
    risk_type?: string;
}

interface ActionItemsGridProps {
    actionItems: ActionItem[];
    hasProfile: boolean;
}

export const ActionItemsGrid: React.FC<ActionItemsGridProps> = ({ actionItems, hasProfile }) => {
    const [filter, setFilter] = useState<string>('all');

    if (!hasProfile) {
        return (
            <div className="action-grid-container empty">
                <div className="empty-state">
                    <AlertTriangle size={32} className="empty-icon" />
                    <h3>No Actions Yet</h3>
                    <p>Complete your profile to get personalized financial recommendations.</p>
                    <Link to="/profile" className="empty-cta">
                        Complete Profile <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    // Sort by priority and score impact
    const sortedItems = [...actionItems].sort((a, b) => {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (b.estimated_score_impact || 0) - (a.estimated_score_impact || 0);
    });

    const filteredItems = filter === 'all'
        ? sortedItems
        : sortedItems.filter(item => item.priority.toLowerCase() === filter);

    const getCategoryIcon = (category?: string, riskType?: string) => {
        const type = category?.toLowerCase() || riskType?.toLowerCase() || '';
        if (type.includes('emergency') || type.includes('liquidity')) return <Wallet size={18} />;
        if (type.includes('insurance') || type.includes('protection')) return <Shield size={18} />;
        if (type.includes('investment') || type.includes('sip')) return <TrendingUp size={18} />;
        if (type.includes('debt') || type.includes('emi')) return <AlertTriangle size={18} />;
        return <Target size={18} />;
    };

    const getToolLink = (item: ActionItem): string => {
        const type = item.linked_tool || item.category || item.risk_type || '';
        const typeLower = type.toLowerCase();

        if (typeLower.includes('sip') || typeLower.includes('investment')) return '/calculators?tool=sip';
        if (typeLower.includes('insurance')) return '/calculators?tool=life-insurance';
        if (typeLower.includes('emi') || typeLower.includes('debt')) return '/calculators?tool=emi';
        if (typeLower.includes('retirement')) return '/calculators?tool=retirement';
        if (typeLower.includes('emergency')) return '/calculators?tool=sip&context=emergency';
        return '/calculators';
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'in_progress': return <PlayCircle size={14} className="status-icon in-progress" />;
            case 'resolved': return <CheckCircle2 size={14} className="status-icon resolved" />;
            default: return <Clock size={14} className="status-icon pending" />;
        }
    };

    const highCount = actionItems.filter(i => i.priority === 'High').length;
    const mediumCount = actionItems.filter(i => i.priority === 'Medium').length;
    const lowCount = actionItems.filter(i => i.priority === 'Low').length;

    if (actionItems.length === 0) {
        return (
            <div className="action-grid-container all-clear">
                <div className="all-clear-state">
                    <CheckCircle2 size={48} className="all-clear-icon" />
                    <h3>All Clear!</h3>
                    <p>Your finances are in great shape. Keep up the good work!</p>
                    <Link to="/calculators" className="explore-cta">
                        Explore Calculators <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="action-grid-container">
            {/* Header */}
            <div className="action-header">
                <div className="header-left">
                    <h3 className="section-title">
                        <Zap size={20} className="title-icon" />
                        Financial Fixes
                    </h3>
                    <span className="item-count">{actionItems.length} actions</span>
                </div>

                {/* Filter Pills */}
                <div className="filter-pills">
                    <button
                        className={`pill ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`pill high ${filter === 'high' ? 'active' : ''}`}
                        onClick={() => setFilter('high')}
                    >
                        High ({highCount})
                    </button>
                    <button
                        className={`pill medium ${filter === 'medium' ? 'active' : ''}`}
                        onClick={() => setFilter('medium')}
                    >
                        Medium ({mediumCount})
                    </button>
                    <button
                        className={`pill low ${filter === 'low' ? 'active' : ''}`}
                        onClick={() => setFilter('low')}
                    >
                        Low ({lowCount})
                    </button>
                </div>
            </div>

            {/* Action Items Grid */}
            <div className="items-grid">
                {filteredItems.map((item, index) => (
                    <div key={item.id || index} className={`action-item priority-${item.priority.toLowerCase()}`}>
                        {/* Priority Badge */}
                        <div className={`priority-badge ${item.priority.toLowerCase()}`}>
                            {item.priority}
                        </div>

                        {/* Status Indicator */}
                        <div className="status-indicator">
                            {getStatusIcon(item.status)}
                            <span>{item.status === 'in_progress' ? 'In Progress' : item.status === 'resolved' ? 'Resolved' : 'Pending'}</span>
                        </div>

                        {/* Content */}
                        <div className="item-content">
                            <div className="item-icon">
                                {getCategoryIcon(item.category, item.risk_type)}
                            </div>
                            <h4 className="item-title">{item.title}</h4>
                            {item.description && (
                                <p className="item-description">{item.description}</p>
                            )}
                        </div>

                        {/* Metrics */}
                        <div className="item-metrics">
                            {item.gap_amount !== undefined && item.gap_amount > 0 && (
                                <div className="metric gap">
                                    <span className="metric-label">Gap</span>
                                    <span className="metric-value">₹{item.gap_amount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {item.estimated_score_impact !== undefined && item.estimated_score_impact > 0 && (
                                <div className="metric impact">
                                    <Zap size={12} />
                                    <span>+{item.estimated_score_impact} pts</span>
                                </div>
                            )}
                        </div>

                        {/* CTA */}
                        <Link to={getToolLink(item)} className="item-cta">
                            Fix Now <ChevronRight size={16} />
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};
