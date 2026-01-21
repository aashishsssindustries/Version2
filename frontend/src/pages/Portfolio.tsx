import React, { useEffect, useState } from 'react';
import { Briefcase, Trash2, TrendingUp, AlertCircle, BarChart3, Plus, Download } from 'lucide-react';
import ManualEntry from '../components/portfolio/ManualEntry';
import CsvUpload from '../components/portfolio/CsvUpload';
import AllocationChart from '../components/portfolio/AllocationChart';
import HoldingsBarChart from '../components/portfolio/HoldingsBarChart';
import PortfolioTreemap from '../components/portfolio/PortfolioTreemap';
import ImportPortfolioModal from '../components/portfolio/ImportPortfolioModal';
import { portfolioService } from '../services/api';
import PortfolioHealthSummary from '../components/portfolio/PortfolioHealthSummary';
import PortfolioSkeleton from '../components/portfolio/PortfolioSkeleton';
import './Portfolio.css';
import '../components/portfolio/PortfolioCharts.css';

interface Holding {
    id: string;
    isin: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    ticker?: string;
    quantity: number;
    current_nav?: number;
    last_valuation?: number;
}

interface PortfolioSummary {
    totalValuation: number;
    holdingsCount: number;
}

const Portfolio: React.FC = () => {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [summary, setSummary] = useState<PortfolioSummary>({ totalValuation: 0, holdingsCount: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const fetchHoldings = async () => {
        try {
            setLoading(true);
            const response = await portfolioService.getHoldings();
            setHoldings(response.holdings || []);
            setSummary(response.summary || { totalValuation: 0, holdingsCount: 0 });
        } catch (err: any) {
            console.error('Failed to fetch holdings', err);
            setError('Failed to load portfolio holdings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHoldings();
    }, []);

    const handleManualAdd = async (isin: string, assetType: string, quantity: number) => {
        const result = await portfolioService.addManualHolding(isin, assetType, quantity);
        if (result.success) {
            fetchHoldings();
        }
        return result;
    };

    const handleCsvUpload = async (csv: string) => {
        const result = await portfolioService.uploadCSV(csv);
        if (result.success || result.imported > 0) {
            fetchHoldings();
        }
        return result;
    };

    const handleCasUpload = async (file: File, password?: string) => {
        const result = await portfolioService.uploadCAS(file, password);
        if (result.success || result.data?.imported > 0) {
            fetchHoldings();
        }
        return result;
    };

    const handleDelete = async (holdingId: string) => {
        if (!confirm('Are you sure you want to delete this holding?')) return;

        setDeleteLoading(holdingId);
        try {
            const result = await portfolioService.deleteHolding(holdingId);
            if (result.success) {
                fetchHoldings();
            }
        } catch (err: any) {
            console.error('Failed to delete holding', err);
            setError('Failed to delete holding');
        } finally {
            setDeleteLoading(null);
        }
    };

    const formatCurrency = (value: number | undefined) => {
        if (!value) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatQuantity = (value: number) => {
        // Round to 4 decimal places to avoid floating-point precision issues
        const rounded = Math.round(value * 10000) / 10000;
        // If it's a whole number, show without decimals
        if (Number.isInteger(rounded)) {
            return rounded.toString();
        }
        return rounded.toFixed(4).replace(/\.?0+$/, '');
    };

    const topHoldingId = holdings.length > 0
        ? holdings.reduce((prev, current) => (prev.last_valuation || 0) > (current.last_valuation || 0) ? prev : current).id
        : null;

    if (loading) {
        return <PortfolioSkeleton />;
    }

    return (
        <div className="portfolio-container">
            {/* Header */}
            <div className="portfolio-header mb-6">
                <div className="header-content mb-6">
                    <Briefcase size={28} className="header-icon" />
                    <div>
                        <h1>My Portfolio</h1>
                        <p className="subtitle">Track your investments in one place (read-only)</p>
                    </div>
                    <button className="btn-import-portfolio" onClick={() => setShowImportModal(true)}>
                        <Download size={18} />
                        Import Portfolio
                    </button>
                </div>

                {/* New Health Summary Strip */}
                <PortfolioHealthSummary
                    holdings={holdings}
                    totalValuation={summary.totalValuation}
                />
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <ImportPortfolioModal
                    onClose={() => setShowImportModal(false)}
                    onManualAdd={handleManualAdd}
                    onCsvUpload={handleCsvUpload}
                    onCasUpload={handleCasUpload}
                />
            )}

            {/* Import Section */}
            <div className="import-section">
                <h2>Import Holdings</h2>
                <div className="import-grid">
                    <ManualEntry onAdd={handleManualAdd} />
                    <CsvUpload onUpload={handleCsvUpload} />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            {/* Analytics Charts */}
            {!loading && holdings.length > 0 && (
                <div className="analytics-section">
                    <div className="section-header mb-4">
                        <h2 className="flex items-center gap-2 mb-1">
                            <BarChart3 size={20} />
                            Portfolio Analytics
                        </h2>
                        <p className="text-sm text-gray-500 ml-7">Visual insights into your asset allocation and performance.</p>
                    </div>
                    <div className="charts-grid">
                        <AllocationChart holdings={holdings} />
                        <HoldingsBarChart holdings={holdings} />
                        <PortfolioTreemap holdings={holdings} />
                    </div>
                </div>
            )}

            {/* Holdings Table */}
            <div className="holdings-section">
                <h2>
                    <TrendingUp size={20} />
                    Your Holdings
                </h2>

                {holdings.length === 0 ? (
                    <div className="empty-state">
                        <Briefcase size={64} strokeWidth={1} className="empty-icon" />
                        <h3>No Holdings Yet</h3>
                        <p>Your portfolio is currently empty. Add your first investment to start tracking your wealth journey.</p>
                        <button
                            className="btn-add-first"
                            onClick={() => document.querySelector('.manual-entry-card')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <Plus size={18} />
                            Add Investment
                        </button>
                    </div>
                ) : (
                    <div className="holdings-table-wrapper">
                        <table className="holdings-table">
                            <thead>
                                <tr>
                                    <th>Name / ISIN</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>NAV</th>
                                    <th>Valuation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((holding) => (
                                    <tr
                                        key={holding.id}
                                        className={holding.id === topHoldingId ? 'top-holding' : ''}
                                    >
                                        <td>
                                            <div className="holding-name">
                                                <span className="name">{holding.name}</span>
                                                <span className="isin">{holding.isin}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-badge ${holding.type.toLowerCase()}`}>
                                                {holding.type === 'MUTUAL_FUND' ? 'MF' : 'EQ'}
                                            </span>
                                        </td>
                                        <td className="quantity">{formatQuantity(holding.quantity)}</td>
                                        <td>{formatCurrency(holding.current_nav)}</td>
                                        <td className="valuation">{formatCurrency(holding.last_valuation)}</td>
                                        <td>
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => handleDelete(holding.id)}
                                                disabled={deleteLoading === holding.id}
                                                title="Delete holding"
                                            >
                                                {deleteLoading === holding.id ? (
                                                    <div className="spinner-small"></div>
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Portfolio;
