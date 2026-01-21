import React, { useState } from 'react';
import { ChevronDown, Calendar, RefreshCw } from 'lucide-react';
import './SecondaryContextBar.css';

interface SecondaryContextBarProps {
    lastUpdated?: string;
}

const SecondaryContextBar: React.FC<SecondaryContextBarProps> = ({ lastUpdated }) => {
    const [selectedPortfolio, setSelectedPortfolio] = useState('All Portfolios');
    const [selectedDateRange, setSelectedDateRange] = useState('1M');
    const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);

    const portfolioOptions = [
        'All Portfolios',
        'Personal',
        'Retirement',
        'Tax Saving',
    ];

    const dateRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

    const formattedDate = lastUpdated
        ? new Date(lastUpdated).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : 'Just now';

    return (
        <div className="secondary-context-bar">
            <div className="context-bar-content">
                {/* Left Section - Portfolio Selector */}
                <div className="context-bar-left">
                    <div className="portfolio-selector">
                        <button
                            className="portfolio-dropdown-trigger"
                            onClick={() => setShowPortfolioDropdown(!showPortfolioDropdown)}
                            onBlur={() => setTimeout(() => setShowPortfolioDropdown(false), 150)}
                        >
                            <span className="portfolio-label">Portfolio:</span>
                            <span className="portfolio-value">{selectedPortfolio}</span>
                            <ChevronDown size={14} className={`dropdown-icon ${showPortfolioDropdown ? 'open' : ''}`} />
                        </button>

                        {showPortfolioDropdown && (
                            <div className="portfolio-dropdown-menu">
                                {portfolioOptions.map((option) => (
                                    <button
                                        key={option}
                                        className={`portfolio-option ${selectedPortfolio === option ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedPortfolio(option);
                                            setShowPortfolioDropdown(false);
                                        }}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Section - Date Range Pills */}
                <div className="context-bar-center">
                    <div className="date-range-selector">
                        <Calendar size={14} className="date-icon" />
                        <div className="date-range-pills">
                            {dateRanges.map((range) => (
                                <button
                                    key={range}
                                    className={`date-pill ${selectedDateRange === range ? 'active' : ''}`}
                                    onClick={() => setSelectedDateRange(range)}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Section - Last Updated */}
                <div className="context-bar-right">
                    <div className="last-updated-info">
                        <RefreshCw size={12} className="refresh-icon" />
                        <span className="update-label">Last Updated:</span>
                        <span className="update-time">{formattedDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecondaryContextBar;
