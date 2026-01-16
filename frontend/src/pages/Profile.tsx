import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Edit2, ChevronRight, RefreshCw,
    TrendingUp, Wallet, Shield, Target, AlertCircle, CheckCircle2,
    DollarSign, CreditCard, PiggyBank, Umbrella
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
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditComplete = () => {
        setShowEditModal(false);
        fetchProfile();
        navigate('/profile?updated=true');
    };

    // Calculate derived values
    const monthlyIncome = profile?.gross_income ? profile.gross_income / 12 : 0;
    const monthlyExpenses = profile?.fixed_expenses || 0;
    const monthlyEMI = profile?.monthly_emi || 0;
    const netSurplus = monthlyIncome - monthlyExpenses - monthlyEMI;

    const existingAssets = profile?.existing_assets || 0;
    const emergencyFund = profile?.emergency_fund_amount || existingAssets * 0.3;
    const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;

    const insurancePremium = profile?.insurance_premium || 0;
    const lifeCover = profile?.insurance_cover || profile?.insurance_coverage || 0;
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
                    <button className="edit-btn" onClick={() => setShowEditModal(true)}>
                        <Edit2 size={16} />
                        Edit Profile
                    </button>
                </div>
            </header>

            <main className="profile-main">
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
