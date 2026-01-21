import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Edit2, ChevronRight, RefreshCw,
    TrendingUp, Wallet, Shield, Target, AlertCircle, CheckCircle2,
    DollarSign, CreditCard, PiggyBank, Umbrella, Download, ArrowLeft
} from 'lucide-react';
import { profileService } from '../services/api';
import { ProfileEditModal } from '../components/profile/ProfileEditModal';
import './Profile.css';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);
        } catch (err: any) {
            console.error('Failed to fetch profile', err);
            // If 404, this is a new user - automatically open edit modal
            if (err.response?.status === 404) {
                setShowEditModal(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditComplete = async () => {
        setShowEditModal(false);
        await fetchProfile(); // Wait for profile to refresh
        navigate('/dashboard?updated=true'); // Go to dashboard with success flag
    };

    // Debug Profile Data
    useEffect(() => {
        if (profile) {
            console.log('Profile Data Loaded:', {
                income: profile.gross_income,
                assets: profile.existing_assets,
                insurance_coverage: profile.insurance_coverage,
                insurance_cover: profile.insurance_cover,
                emergency_amount: profile.emergency_fund_amount,
                raw: profile
            });
        }
    }, [profile]);

    // Calculate derived values
    const monthlyIncome = profile?.gross_income ? profile.gross_income / 12 : 0;
    const monthlyExpenses = profile?.fixed_expenses || 0;
    const monthlyEMI = profile?.monthly_emi || 0;
    const netSurplus = monthlyIncome - monthlyExpenses - monthlyEMI;

    const existingAssets = Number(profile?.existing_assets) || 0;

    // Fallback Logic: Use stored emergency fund ONLY if > 0. Otherwise use 30% of assets.
    const storedEF = Number(profile?.emergency_fund_amount) || 0;
    const emergencyFund = storedEF > 0 ? storedEF : (existingAssets * 0.3);

    const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;

    const insurancePremium = profile?.insurance_premium || 0;
    const lifeCover = Number(profile?.insurance_cover) || Number(profile?.insurance_coverage) || 0;
    const idealCover = monthlyIncome * 12 * 10; // 10x annual income
    const coverageAdequacy = lifeCover >= idealCover ? 'Adequate' : 'Under-insured';

    // Profile completion calculation
    const requiredFields = ['gross_income', 'fixed_expenses', 'monthly_emi', 'existing_assets', 'insurance_premium'];
    const completedFields = requiredFields.filter(f => profile?.[f] && profile[f] > 0);
    const completionPercent = Math.round((completedFields.length / requiredFields.length) * 100);

    // Asset diversification
    const assetTypes = profile?.asset_types || [];
    const diversification = assetTypes.length >= 4 ? 'High' : assetTypes.length >= 2 ? 'Medium' : 'Low';

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    };

    const [downloadingPDF, setDownloadingPDF] = useState(false);

    const handleDownloadReport = async () => {
        if (completionPercent < 80) return;
        try {
            setDownloadingPDF(true);
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/pdf/advisory-report`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' }
                }
            );
            if (!response.ok) throw new Error('Failed to generate PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `WealthMax_Advisory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('PDF Error:', err);
        } finally {
            setDownloadingPDF(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    const fetchAuditLogs = async () => {
        try {
            setLogsLoading(true);
            const data = await profileService.getAuditLogs();
            setAuditLogs(data);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'security' && auditLogs.length === 0) {
            fetchAuditLogs();
        }
    }, [activeTab]);

    // Pagination Logic
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = auditLogs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(auditLogs.length / logsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (loading && !profile) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <span>Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Breadcrumb Navigation */}
            <nav className="breadcrumb">
                <Link to="/dashboard"><ArrowLeft size={14} /> Dashboard</Link>
                <span>/</span>
                <span className="current">My Profile</span>
            </nav>

            {/* Section 1: Sticky Header */}
            <header className="profile-header">
                <div className="header-content">
                    <div className="profile-identity">
                        <div className="avatar">
                            {getInitials(user.name)}
                        </div>
                        <div className="identity-info">
                            <h1 className="user-name">{user.name || 'User'}</h1>
                            <div className="contact-badges">
                                <span className="badge email">
                                    <Mail size={12} />
                                    {user.email}
                                    <CheckCircle2 size={12} className="verified" />
                                </span>
                                {user.mobile && (
                                    <span className="badge phone">
                                        <Phone size={12} />
                                        {user.mobile}
                                        <CheckCircle2 size={12} className="verified" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="profile-tags">
                        {profile?.persona_data?.persona?.name && (
                            <span className="tag persona">
                                {profile.persona_data.persona.name}
                            </span>
                        )}
                        <span className={`tag risk ${(profile?.risk_class || 'moderate').toLowerCase()}`}>
                            {profile?.risk_class || profile?.persona_data?.persona?.risk_appetite || 'Unassessed'}
                        </span>
                    </div>
                    <div className="header-actions">
                        <button
                            className={`download-btn ${completionPercent < 80 ? 'disabled' : ''}`}
                            onClick={handleDownloadReport}
                            disabled={downloadingPDF || completionPercent < 80}
                            title={completionPercent < 80 ? 'Complete 80% of profile to download' : 'Download Advisory Report'}
                        >
                            <Download size={16} />
                            {downloadingPDF ? 'Generating...' : 'Download Report'}
                        </button>
                        <button className="edit-btn" onClick={() => setShowEditModal(true)}>
                            <Edit2 size={16} />
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security & Activity
                    </button>
                </div>
            </header>

            <main className="profile-main">
                {activeTab === 'overview' ? (
                    <>
                        {/* Section 5: Data Integrity Alert (Show at top if incomplete) */}
                        {completionPercent < 100 && (
                            <div className="integrity-alert">
                                <div className="alert-content">
                                    <AlertCircle size={20} />
                                    <div>
                                        <strong>Profile Incomplete</strong>
                                        <p>Completing your profile improves accuracy of recommendations.</p>
                                    </div>
                                </div>
                                <div className="completion-bar">
                                    <div className="progress" style={{ width: `${completionPercent}%` }}></div>
                                </div>
                                <span className="completion-text">{completionPercent}% complete</span>
                            </div>
                        )}

                        {/* Section 2: Financial Snapshot */}
                        <section className="section">
                            <h2 className="section-title">
                                <DollarSign size={20} />
                                Financial Snapshot
                            </h2>
                            <div className="snapshot-grid">
                                <div className="snapshot-card income">
                                    <div className="card-icon"><TrendingUp size={24} /></div>
                                    <div className="card-content">
                                        <span className="card-label">Monthly Income</span>
                                        <span className="card-value">₹{monthlyIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    {!profile?.gross_income && <span className="incomplete-badge">Incomplete</span>}
                                </div>
                                <div className="snapshot-card expenses">
                                    <div className="card-icon"><CreditCard size={24} /></div>
                                    <div className="card-content">
                                        <span className="card-label">Monthly Expenses</span>
                                        <span className="card-value">₹{monthlyExpenses.toLocaleString('en-IN')}</span>
                                    </div>
                                    {!profile?.fixed_expenses && <span className="incomplete-badge">Incomplete</span>}
                                </div>
                                <div className="snapshot-card emi">
                                    <div className="card-icon"><Wallet size={24} /></div>
                                    <div className="card-content">
                                        <span className="card-label">Monthly EMI</span>
                                        <span className="card-value">₹{monthlyEMI.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className={`snapshot-card surplus ${netSurplus >= 0 ? 'positive' : 'negative'}`}>
                                    <div className="card-icon"><PiggyBank size={24} /></div>
                                    <div className="card-content">
                                        <span className="card-label">Net Surplus</span>
                                        <span className="card-value">₹{netSurplus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <span className="derived-badge">Derived</span>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Assets & Protection */}
                        <section className="section">
                            <h2 className="section-title">
                                <Shield size={20} />
                                Assets & Protection
                            </h2>
                            <div className="two-column-grid">
                                {/* Left: Assets */}
                                <div className="info-card">
                                    <h3 className="card-header">
                                        <PiggyBank size={18} />
                                        Assets
                                    </h3>
                                    <div className="info-rows">
                                        <div className="info-row">
                                            <span className="label">Total Savings/Investments</span>
                                            <span className="value">₹{existingAssets.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Emergency Fund</span>
                                            <span className="value">
                                                ₹{emergencyFund.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                <span className="subtext">({emergencyMonths.toFixed(1)} months)</span>
                                            </span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Asset Diversification</span>
                                            <span className={`status-chip ${diversification.toLowerCase()}`}>
                                                {diversification}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Insurance */}
                                <div className="info-card">
                                    <h3 className="card-header">
                                        <Umbrella size={18} />
                                        Insurance
                                    </h3>
                                    <div className="info-rows">
                                        <div className="info-row">
                                            <span className="label">Annual Premium</span>
                                            <span className="value">₹{insurancePremium.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Life Cover Amount</span>
                                            <span className="value">₹{lifeCover.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Coverage Status</span>
                                            <span className={`status-chip ${coverageAdequacy === 'Adequate' ? 'good' : 'warning'}`}>
                                                {coverageAdequacy}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Assessment & Persona Summary */}
                        <section className="section">
                            <h2 className="section-title">
                                <Target size={20} />
                                Assessment Summary
                            </h2>
                            <div className="assessment-grid">
                                <div className="assessment-card">
                                    <User size={24} className="icon" />
                                    <div className="content">
                                        <span className="label">Assigned Persona</span>
                                        <span className="value">{profile?.persona_data?.persona?.name || 'Not Assigned'}</span>
                                    </div>
                                    <Link to="/risk-assessment" className="card-link">
                                        View Details <ChevronRight size={14} />
                                    </Link>
                                </div>
                                <div className="assessment-card">
                                    <Shield size={24} className="icon" />
                                    <div className="content">
                                        <span className="label">Risk Appetite</span>
                                        <span className="value">{profile?.risk_class || profile?.persona_data?.persona?.risk_appetite || 'Unknown'}</span>
                                    </div>
                                    <Link to="/risk-assessment" className="card-link">
                                        <RefreshCw size={12} /> Retake Survey
                                    </Link>
                                </div>
                                <div className="assessment-card">
                                    <TrendingUp size={24} className="icon" />
                                    <div className="content">
                                        <span className="label">Health Score</span>
                                        <span className="value score">{profile?.health_score || 0}/100</span>
                                    </div>
                                    <Link to="/dashboard" className="card-link">
                                        View Breakdown <ChevronRight size={14} />
                                    </Link>
                                </div>
                                <div className="assessment-card">
                                    <Target size={24} className="icon" />
                                    <div className="content">
                                        <span className="label">Last Updated</span>
                                        <span className="value date">
                                            {profile?.updated_at
                                                ? new Date(profile.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : 'Never'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="section">
                        <div className="security-header mb-6">
                            <h2 className="section-title mb-1">
                                <Shield size={20} />
                                Security & Activity Log
                            </h2>
                            <p className="text-sm text-gray-500">Track all sensitive actions taken on your account.</p>
                        </div>

                        {logsLoading ? (
                            <div className="profile-loading" style={{ minHeight: '200px' }}>
                                <div className="loading-spinner"></div>
                                <span>Loading activity logs...</span>
                            </div>
                        ) : (
                            <div className="audit-table-container">
                                <table className="audit-table">
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Action</th>
                                            <th>Details</th>
                                            <th>IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentLogs.length > 0 ? (
                                            currentLogs.map((log: any) => (
                                                <tr key={log.id}>
                                                    <td className="whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString('en-IN', {
                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td>
                                                        <span className="action-badge">{log.action.replace('_', ' ')}</span>
                                                    </td>
                                                    <td className="max-w-xs truncate text-gray-500 text-sm">
                                                        {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                                                        {log.details && JSON.stringify(log.details).length > 50 ? '...' : ''}
                                                    </td>
                                                    <td className="font-mono text-xs">{log.ip_address || 'Unknown'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-gray-400">
                                                    No activity logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => paginate(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            Prev
                                        </button>
                                        <span className="pagination-info">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => paginate(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Edit Modal */}
            {showEditModal && (
                <ProfileEditModal
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleEditComplete}
                />
            )}
        </div>
    );
};

export default Profile;
