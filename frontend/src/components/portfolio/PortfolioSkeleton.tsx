import React from 'react';
import '../../pages/Portfolio.css';

const PortfolioSkeleton: React.FC = () => {
    return (
        <div className="portfolio-container">
            {/* Header Skeleton */}
            <div className="portfolio-header mb-6">
                <div className="header-content mb-6">
                    <div className="skeleton w-10 h-10 rounded-xl"></div>
                    <div className="flex flex-col gap-2">
                        <div className="skeleton w-48 h-8 rounded-md"></div>
                        <div className="skeleton w-64 h-4 rounded-md"></div>
                    </div>
                </div>

                {/* Health Strip Skeleton */}
                <div className="portfolio-health-summary">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="health-card">
                            <div className="skeleton w-24 h-4 rounded mb-4"></div>
                            <div className="skeleton w-32 h-8 rounded mb-2"></div>
                            <div className="skeleton w-20 h-3 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Import Section Skeleton */}
            <div className="import-section mb-6">
                <div className="skeleton w-40 h-6 rounded mb-4"></div>
                <div className="import-grid">
                    <div className="skeleton w-full h-80 rounded-xl"></div>
                    <div className="skeleton w-full h-80 rounded-xl"></div>
                </div>
            </div>

            {/* Charts Section Skeleton */}
            <div className="analytics-section mb-6">
                <div className="section-header mb-4">
                    <div className="skeleton w-48 h-6 rounded mb-2"></div>
                    <div className="skeleton w-64 h-3 rounded ml-7"></div>
                </div>
                <div className="charts-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="chart-container" style={{ height: '300px' }}>
                            <div className="skeleton w-32 h-5 rounded mb-4"></div>
                            <div className="skeleton w-full h-48 rounded-full opacity-50 mx-auto"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="holdings-section">
                <div className="skeleton w-40 h-6 rounded mb-6"></div>
                <div className="holdings-table-wrapper">
                    <div className="w-full">
                        {/* Table Header */}
                        <div className="flex gap-4 p-4 border-b border-gray-200">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="skeleton w-full h-4 rounded"></div>
                            ))}
                        </div>
                        {/* Rows */}
                        {[1, 2, 3, 4, 5].map((row) => (
                            <div key={row} className="flex gap-4 p-4 border-b border-gray-100">
                                <div className="skeleton w-1/4 h-5 rounded"></div>
                                <div className="skeleton w-1/6 h-5 rounded"></div>
                                <div className="skeleton w-1/6 h-5 rounded"></div>
                                <div className="skeleton w-1/6 h-5 rounded"></div>
                                <div className="skeleton w-1/6 h-5 rounded"></div>
                                <div className="skeleton w-10 h-8 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSkeleton;
