import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Download,
    Bell,
    TrendingUp,
    TrendingDown,
    User,
    Calculator,
    ChevronRight,
    Zap
} from 'lucide-react';
import './UtilityPanel.css';

interface UtilityPanelProps {
    onDownloadReport?: () => void;
    isDownloading?: boolean;
    canDownload?: boolean;
    profileComplete?: boolean;
}

const UtilityPanel: React.FC<UtilityPanelProps> = ({
    onDownloadReport,
    isDownloading = false,
    canDownload = true,
    profileComplete = true,
}) => {
    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard';

    // Mock market data for display
    const marketData = [
        { name: 'NIFTY 50', value: '22,147.00', change: '+0.42%', isPositive: true },
        { name: 'SENSEX', value: '72,831.94', change: '+0.38%', isPositive: true },
        { name: 'BANK NIFTY', value: '47,125.50', change: '-0.12%', isPositive: false },
    ];

    return (
        <aside className="utility-panel">
            {/* Quick Actions */}
            <div className="utility-section">
                <h3 className="utility-section-title">Quick Actions</h3>
                <div className="quick-actions">
                    {!profileComplete && (
                        <Link to="/profile" className="quick-action-btn profile-incomplete">
                            <User size={16} />
                            <span>Complete Profile</span>
                            <ChevronRight size={14} />
                        </Link>
                    )}

                    {isDashboard && onDownloadReport && (
                        <button
                            className={`quick-action-btn download ${!canDownload ? 'disabled' : ''}`}
                            onClick={onDownloadReport}
                            disabled={isDownloading || !canDownload}
                        >
                            <Download size={16} />
                            <span>{isDownloading ? 'Generating...' : 'Download Report'}</span>
                        </button>
                    )}

                    <Link to="/calculators" className="quick-action-btn">
                        <Calculator size={16} />
                        <span>Plan Goals</span>
                        <ChevronRight size={14} />
                    </Link>

                    <Link to="/risk-assessment" className="quick-action-btn">
                        <Zap size={16} />
                        <span>Risk Check</span>
                        <ChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Market Summary */}
            <div className="utility-section">
                <h3 className="utility-section-title">Market Summary</h3>
                <div className="market-summary">
                    {marketData.map((item) => (
                        <div key={item.name} className="market-item">
                            <div className="market-info">
                                <span className="market-name">{item.name}</span>
                                <span className="market-value">{item.value}</span>
                            </div>
                            <div className={`market-change ${item.isPositive ? 'positive' : 'negative'}`}>
                                {item.isPositive ? (
                                    <TrendingUp size={12} />
                                ) : (
                                    <TrendingDown size={12} />
                                )}
                                <span>{item.change}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="market-disclaimer">* Indicative values. Not real-time.</p>
            </div>

            {/* Notifications */}
            <div className="utility-section">
                <h3 className="utility-section-title">
                    <Bell size={14} />
                    <span>Alerts</span>
                </h3>
                <div className="notifications-list">
                    <div className="notification-item">
                        <div className="notification-dot info"></div>
                        <p>Your profile is being analyzed for personalized recommendations.</p>
                    </div>
                    <div className="notification-item">
                        <div className="notification-dot success"></div>
                        <p>Financial health score calculated successfully.</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default UtilityPanel;
